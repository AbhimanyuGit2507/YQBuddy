"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const notifications_service_1 = require("../notifications/notifications.service");
const webhooks_service_1 = require("../webhooks/webhooks.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const client_1 = require("@prisma/client");
let TokenService = class TokenService {
    prisma;
    redisService;
    notificationsService;
    webhooksService;
    whatsappService;
    constructor(prisma, redisService, notificationsService, webhooksService, whatsappService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.notificationsService = notificationsService;
        this.webhooksService = webhooksService;
        this.whatsappService = whatsappService;
    }
    async requestOtp(phone) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.client.set(`otp:${phone}`, otp, 'EX', 300);
        await this.notificationsService.sendWhatsAppMessage(phone, `Your Qmover verification code is: ${otp}. It expires in 5 minutes.`);
        return { success: true, message: 'OTP sent' };
    }
    async joinQueue(queueId, customerName, phone, otp, formResponses, language = 'en', scheduledFor) {
        if (otp && phone) {
            const storedOtp = await this.redisService.client.get(`otp:${phone}`);
            if (!storedOtp || storedOtp !== otp) {
                throw new common_1.BadRequestException('Invalid or expired OTP');
            }
            await this.redisService.client.del(`otp:${phone}`);
        }
        let purpose = null;
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
        });
        if (queue && queue.formConfig && Array.isArray(queue.formConfig)) {
            const purposeField = queue.formConfig.find((f) => (f.type === 'dropdown' || f.id === 'purpose') &&
                f.label?.toLowerCase().includes('purpose'));
            if (purposeField &&
                purposeField.id &&
                formResponses &&
                formResponses[purposeField.id]) {
                purpose = formResponses[purposeField.id];
            }
        }
        const isAppointment = !!scheduledFor;
        const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
        const token = await this.prisma.token.create({
            data: {
                queueId,
                customerName,
                phone,
                status: client_1.TokenStatus.WAITING,
                formResponses,
                purpose,
                language,
                isAppointment,
                scheduledFor: scheduledDate,
                checkedIn: !isAppointment,
            },
        });
        if (!isAppointment) {
            await this.redisService.client.rpush(`queue:${queueId}:tokens`, token.id);
            this.redisService.client.publish('queue_events', JSON.stringify({ type: 'TOKEN_JOINED', queueId, token }));
        }
        else {
            this.redisService.client.publish('queue_events', JSON.stringify({ type: 'APPOINTMENT_CREATED', queueId, token }));
        }
        if (phone) {
            const appUrl = process.env.APP_URL || 'http://localhost:3001';
            if (isAppointment) {
                await this.notificationsService.sendWhatsAppMessage(phone, `Hello ${customerName}! Your appointment is scheduled for ${scheduledDate?.toLocaleString()}. Track your status here: ${appUrl}/customer/status/${token.id}`, queue?.workspaceId);
            }
            else {
                await this.notificationsService.sendWhatsAppMessage(phone, `Hello ${customerName}! You have successfully joined the queue. You can track your live status here: ${appUrl}/customer/status/${token.id}`, queue?.workspaceId);
            }
        }
        return token;
    }
    async advanceQueue(queueId) {
        const currentlyServingId = await this.redisService.client.get(`queue:${queueId}:serving`);
        if (currentlyServingId) {
            const updatedToken = await this.prisma.token.update({
                where: { id: currentlyServingId },
                data: {
                    status: client_1.TokenStatus.COMPLETED,
                    completedAt: new Date(),
                },
                include: { queue: true },
            });
            if (updatedToken.phone) {
                await this.whatsappService.requestFeedback(updatedToken.queue.workspaceId, updatedToken.phone, updatedToken.language);
            }
        }
        const nextTokenId = await this.redisService.client.lpop(`queue:${queueId}:tokens`);
        if (!nextTokenId) {
            await this.redisService.client.del(`queue:${queueId}:serving`);
            return null;
        }
        const nextToken = await this.prisma.token.update({
            where: { id: nextTokenId },
            data: {
                status: client_1.TokenStatus.SERVING,
                servedAt: new Date(),
            },
        });
        await this.redisService.client.set(`queue:${queueId}:serving`, nextToken.id);
        this.redisService.client.publish('queue_events', JSON.stringify({ type: 'QUEUE_ADVANCED', queueId, token: nextToken }));
        if (nextToken.phone) {
            await this.notificationsService.sendWhatsAppMessage(nextToken.phone, `Hi ${nextToken.customerName}, it is your turn now! Please proceed to the counter.`, nextToken.queueId);
        }
        const upcomingTokenId = await this.redisService.client.lindex(`queue:${queueId}:tokens`, 0);
        if (upcomingTokenId) {
            const upcomingToken = await this.prisma.token.findUnique({
                where: { id: upcomingTokenId },
            });
            if (upcomingToken && upcomingToken.phone) {
                await this.notificationsService.sendWhatsAppMessage(upcomingToken.phone, `Hi ${upcomingToken.customerName}, you are next in line! Get ready.`, upcomingToken.queueId);
            }
        }
        return nextToken;
    }
    async getTokenStatus(tokenId) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
            include: { queue: true },
        });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        if (token.status !== client_1.TokenStatus.WAITING) {
            return { token, position: 0, estimatedWaitTime: 0 };
        }
        if (token.isAppointment && !token.checkedIn) {
            return { token, position: 0, estimatedWaitTime: 0, isScheduled: true };
        }
        const tokens = await this.redisService.client.lrange(`queue:${token.queueId}:tokens`, 0, -1);
        const position = tokens.indexOf(tokenId) + 1;
        let avgServiceTime = 5;
        if (token.purpose) {
            const cacheKey = `queue:${token.queueId}:purpose:${token.purpose}:avg_time`;
            const cachedTime = await this.redisService.client.get(cacheKey);
            if (cachedTime) {
                avgServiceTime = parseInt(cachedTime, 10);
            }
            else {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const completedTokens = await this.prisma.token.findMany({
                    where: {
                        queueId: token.queueId,
                        purpose: token.purpose,
                        status: client_1.TokenStatus.COMPLETED,
                        completedAt: { not: null },
                        servedAt: { not: null, gte: sevenDaysAgo },
                    },
                    select: { servedAt: true, completedAt: true },
                });
                if (completedTokens.length > 0) {
                    const totalDiff = completedTokens.reduce((acc, t) => {
                        return acc + (t.completedAt.getTime() - t.servedAt.getTime());
                    }, 0);
                    avgServiceTime = Math.max(1, Math.floor(totalDiff / completedTokens.length / 60000));
                }
                await this.redisService.client.set(cacheKey, avgServiceTime.toString(), 'EX', 600);
            }
        }
        const estimatedWaitTime = position * avgServiceTime;
        return { token, position, estimatedWaitTime };
    }
    async validateToken(tokenId) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
            include: { queue: { select: { name: true, workspaceId: true } } },
        });
        if (!token)
            return { valid: false, reason: 'Invalid Token' };
        const servingTokenId = await this.redisService.client.get(`queue:${token.queueId}:serving`);
        if (token.id === servingTokenId) {
            return {
                valid: true,
                status: 'Green',
                tokenId: token.id,
                customerName: token.customerName,
                queueName: token.queue?.name,
                purpose: token.purpose,
                phone: token.phone,
                joinedAt: token.joinedAt,
                queueId: token.queueId,
            };
        }
        return { valid: false, status: 'Red', reason: 'Not currently serving' };
    }
    async cancelToken(tokenId) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
        });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        if (token.status === client_1.TokenStatus.WAITING) {
            await this.redisService.client.lrem(`queue:${token.queueId}:tokens`, 0, tokenId);
        }
        const updatedToken = await this.prisma.token.update({
            where: { id: tokenId },
            data: { status: client_1.TokenStatus.MISSED },
        });
        this.redisService.client.publish('queue_events', JSON.stringify({
            type: 'TOKEN_CANCELLED',
            queueId: token.queueId,
            token: updatedToken,
        }));
        const queue = await this.prisma.queue.findUnique({
            where: { id: token.queueId },
        });
        if (queue) {
            this.webhooksService.triggerWebhooks(queue.workspaceId, 'TOKEN_CANCELLED', updatedToken);
        }
        return updatedToken;
    }
    async transferToken(tokenId, nextQueueId) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
        });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        if (token.queueId === nextQueueId) {
            throw new common_1.BadRequestException('Cannot transfer token to the same queue');
        }
        const nextQueue = await this.prisma.queue.findUnique({
            where: { id: nextQueueId },
        });
        if (!nextQueue) {
            throw new common_1.NotFoundException('Target queue not found');
        }
        if (nextQueue.status !== client_1.QueueStatus.ACTIVE) {
            throw new common_1.BadRequestException('Target queue is not active');
        }
        const servingTokenId = await this.redisService.client.get(`queue:${token.queueId}:serving`);
        if (servingTokenId === tokenId) {
            await this.redisService.client.del(`queue:${token.queueId}:serving`);
        }
        else if (token.status === client_1.TokenStatus.WAITING) {
            await this.redisService.client.lrem(`queue:${token.queueId}:tokens`, 0, tokenId);
        }
        const updatedToken = await this.prisma.token.update({
            where: { id: tokenId },
            data: {
                queueId: nextQueueId,
                status: client_1.TokenStatus.WAITING,
                joinedAt: new Date(),
                servedAt: null,
            },
        });
        await this.redisService.client.rpush(`queue:${nextQueueId}:tokens`, updatedToken.id);
        this.redisService.client.publish('queue_events', JSON.stringify({
            type: 'TOKEN_TRANSFERRED',
            oldQueueId: token.queueId,
            newQueueId: nextQueueId,
            token: updatedToken,
        }));
        const queue = await this.prisma.queue.findUnique({
            where: { id: token.queueId },
        });
        if (queue) {
            this.webhooksService.triggerWebhooks(queue.workspaceId, 'TOKEN_TRANSFERRED', updatedToken);
        }
        if (updatedToken.phone) {
            const newQueue = await this.prisma.queue.findUnique({
                where: { id: nextQueueId },
            });
            await this.notificationsService.sendWhatsAppMessage(updatedToken.phone, `You have been transferred to ${newQueue?.name}. You are now waiting in the new queue.`, newQueue?.workspaceId);
        }
        return updatedToken;
    }
    async checkIn(tokenId) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
        });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        if (token.checkedIn || token.status !== client_1.TokenStatus.WAITING)
            return token;
        const updatedToken = await this.prisma.token.update({
            where: { id: tokenId },
            data: { checkedIn: true, joinedAt: new Date() },
        });
        await this.redisService.client.rpush(`queue:${token.queueId}:tokens`, updatedToken.id);
        this.redisService.client.publish('queue_events', JSON.stringify({
            type: 'TOKEN_JOINED',
            queueId: token.queueId,
            token: updatedToken,
        }));
        if (updatedToken.phone) {
            await this.notificationsService.sendWhatsAppMessage(updatedToken.phone, `Hello ${updatedToken.customerName}! You have been checked in and are now waiting in the live line.`, token.queueId);
        }
        return updatedToken;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        notifications_service_1.NotificationsService,
        webhooks_service_1.WebhooksService,
        whatsapp_service_1.WhatsappService])
], TokenService);
//# sourceMappingURL=token.service.js.map