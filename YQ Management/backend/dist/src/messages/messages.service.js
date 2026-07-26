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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const redis_service_1 = require("../redis/redis.service");
let MessagesService = class MessagesService {
    prisma;
    notificationsService;
    redisService;
    constructor(prisma, notificationsService, redisService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.redisService = redisService;
    }
    async getMessages(tokenId) {
        return this.prisma.message.findMany({
            where: { tokenId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async sendMessageFromOperator(tokenId, text) {
        const token = await this.prisma.token.findUnique({
            where: { id: tokenId },
            include: { queue: { select: { workspaceId: true } } },
        });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        const message = await this.prisma.message.create({
            data: {
                tokenId,
                body: text,
                sender: 'OPERATOR',
            },
        });
        if (token.phone) {
            await this.notificationsService.sendWhatsAppMessage(token.phone, text, token.queue?.workspaceId);
        }
        this.redisService.client.publish('queue_events', JSON.stringify({ type: 'NEW_MESSAGE', queueId: token.queueId, message }));
        return message;
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map