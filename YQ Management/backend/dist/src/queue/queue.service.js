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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const client_1 = require("@prisma/client");
const queue_gateway_1 = require("./queue.gateway");
const webhooks_service_1 = require("../webhooks/webhooks.service");
let QueueService = class QueueService {
    prisma;
    redisService;
    queueGateway;
    webhooksService;
    constructor(prisma, redisService, queueGateway, webhooksService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.queueGateway = queueGateway;
        this.webhooksService = webhooksService;
    }
    async createQueue(workspaceId, name, formConfig) {
        const existing = await this.prisma.queue.findFirst({
            where: { workspaceId, name },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Queue "${name}" already exists in this workspace`);
        }
        const queue = await this.prisma.queue.create({
            data: { workspaceId, name, status: client_1.QueueStatus.ACTIVE, formConfig },
        });
        await this.redisService.client.hset(`queue:${queue.id}:state`, {
            status: client_1.QueueStatus.ACTIVE,
            name: queue.name,
        });
        return queue;
    }
    async updateQueue(queueId, data) {
        return this.prisma.queue.update({
            where: { id: queueId },
            data,
        });
    }
    async getQueuesForTenant(workspaceId) {
        return this.prisma.queue.findMany({
            where: { workspaceId },
            include: { _count: { select: { tokens: true } } },
        });
    }
    async getQueueById(id) {
        return this.prisma.queue.findUnique({
            where: { id },
        });
    }
    async getQueueTokens(queueId) {
        return this.prisma.token.findMany({
            where: {
                queueId,
                status: { in: [client_1.TokenStatus.WAITING, client_1.TokenStatus.SERVING] },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async getHistory(workspaceId) {
        return this.prisma.token.findMany({
            where: {
                queue: { workspaceId },
                status: { in: [client_1.TokenStatus.COMPLETED, client_1.TokenStatus.MISSED] },
            },
            include: { queue: true },
            orderBy: { joinedAt: 'desc' },
            take: 100,
        });
    }
    async updateQueueStatus(queueId, status) {
        const queue = await this.prisma.queue.update({
            where: { id: queueId },
            data: { status },
        });
        await this.redisService.client.hset(`queue:${queue.id}:state`, 'status', status);
        this.queueGateway.broadcastQueueUpdate(queueId, queue.workspaceId, 'queue_status_changed', {
            status,
        });
        return queue;
    }
    async joinQueue(queueId, customerName, phone, isAppointment = false) {
        const token = await this.prisma.token.create({
            data: {
                queueId,
                customerName,
                phone,
                status: client_1.TokenStatus.WAITING,
                isAppointment,
            },
        });
        await this.redisService.client.zadd(`queue:${queueId}:waiting`, Date.now(), token.id);
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
        });
        if (queue) {
            this.queueGateway.broadcastQueueUpdate(queueId, queue.workspaceId, 'token_joined', { token });
            this.webhooksService.triggerWebhooks(queue.workspaceId, 'TOKEN_JOINED', token);
        }
        return token;
    }
    async getEstimatedWaitTime(queueId, tokenId) {
        const rank = await this.redisService.client.zrank(`queue:${queueId}:waiting`, tokenId);
        if (rank === null)
            return 0;
        const avgServiceTimeRaw = await this.redisService.client.get(`queue:${queueId}:avg_time`);
        const avgServiceTime = avgServiceTimeRaw
            ? parseInt(avgServiceTimeRaw, 10)
            : 5;
        const estimatedSeconds = rank * avgServiceTime;
        const MAX_WAIT_SECONDS = 7200;
        return Math.min(estimatedSeconds, MAX_WAIT_SECONDS);
    }
    async advanceTurn(queueId) {
        const nextTokenIds = await this.redisService.client.zpopmin(`queue:${queueId}:waiting`);
        if (!nextTokenIds || nextTokenIds.length === 0)
            return null;
        const tokenId = nextTokenIds[0];
        const token = await this.prisma.token.update({
            where: { id: tokenId },
            data: {
                status: client_1.TokenStatus.SERVING,
                servedAt: new Date(),
            },
        });
        const queue = await this.prisma.queue.findUnique({
            where: { id: queueId },
        });
        if (queue) {
            this.queueGateway.broadcastQueueUpdate(queueId, queue.workspaceId, 'token_serving', { token });
            this.webhooksService.triggerWebhooks(queue.workspaceId, 'TOKEN_SERVING', token);
        }
        return token;
    }
    async completeToken(tokenId) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
            include: { queue: true },
        });
        if (!token)
            throw new common_1.NotFoundException();
        const updatedToken = await this.prisma.token.update({
            where: { id: tokenId },
            data: {
                status: client_1.TokenStatus.COMPLETED,
                completedAt: new Date(),
            },
        });
        if (updatedToken.servedAt && updatedToken.completedAt) {
            const diffMs = updatedToken.completedAt.getTime() - updatedToken.servedAt.getTime();
            const diffMins = Math.max(1, Math.floor(diffMs / 60000));
            const currentAvgRaw = await this.redisService.client.get(`queue:${updatedToken.queueId}:avg_time`);
            let newAvg = diffMins;
            if (currentAvgRaw) {
                newAvg = Math.max(1, Math.floor((parseInt(currentAvgRaw, 10) * 9 + diffMins) / 10));
            }
            await this.redisService.client.set(`queue:${updatedToken.queueId}:avg_time`, newAvg);
        }
        if (token.queue.nextQueueId) {
            await this.joinQueue(token.queue.nextQueueId, token.customerName, token.phone, token.isAppointment);
        }
        this.queueGateway.broadcastQueueUpdate(token.queueId, token.queue.workspaceId, 'token_completed', {
            tokenId,
        });
        this.webhooksService.triggerWebhooks(token.queue.workspaceId, 'TOKEN_COMPLETED', token);
        return true;
    }
    async skipToken(tokenId) {
        const token = await this.prisma.token.update({
            where: { id: tokenId },
            data: { status: client_1.TokenStatus.MISSED },
            include: { queue: true },
        });
        this.queueGateway.broadcastQueueUpdate(token.queueId, token.queue.workspaceId, 'token_missed', {
            tokenId,
        });
        this.webhooksService.triggerWebhooks(token.queue.workspaceId, 'TOKEN_MISSED', token);
        return token;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => queue_gateway_1.QueueGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        queue_gateway_1.QueueGateway,
        webhooks_service_1.WebhooksService])
], QueueService);
//# sourceMappingURL=queue.service.js.map