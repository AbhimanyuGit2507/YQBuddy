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
let QueueService = class QueueService {
    prisma;
    redisService;
    queueGateway;
    constructor(prisma, redisService, queueGateway) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.queueGateway = queueGateway;
    }
    async createQueue(tenantId, name) {
        const queue = await this.prisma.queue.create({
            data: { tenantId, name, status: client_1.QueueStatus.ACTIVE },
        });
        await this.redisService.client.hset(`queue:${queue.id}:state`, {
            status: client_1.QueueStatus.ACTIVE,
            name: queue.name,
        });
        return queue;
    }
    async getQueuesForTenant(tenantId) {
        return this.prisma.queue.findMany({
            where: { tenantId },
            include: { _count: { select: { tokens: true } } },
        });
    }
    async updateQueueStatus(queueId, status) {
        const queue = await this.prisma.queue.update({
            where: { id: queueId },
            data: { status },
        });
        await this.redisService.client.hset(`queue:${queue.id}:state`, 'status', status);
        this.queueGateway.broadcastQueueUpdate(queueId, 'queue_status_changed', { status });
        return queue;
    }
    async joinQueue(queueId, customerName, phone, isAppointment = false) {
        const token = await this.prisma.token.create({
            data: {
                queueId,
                customerName,
                phone,
                status: client_1.TokenStatus.WAITING,
                isAppointment
            }
        });
        await this.redisService.client.zadd(`queue:${queueId}:waiting`, Date.now(), token.id);
        this.queueGateway.broadcastQueueUpdate(queueId, 'token_joined', { token });
        return token;
    }
    async getEstimatedWaitTime(queueId, tokenId) {
        const rank = await this.redisService.client.zrank(`queue:${queueId}:waiting`, tokenId);
        if (rank === null)
            return 0;
        const avgServiceTimeRaw = await this.redisService.client.get(`queue:${queueId}:avg_time`);
        const avgServiceTime = avgServiceTimeRaw ? parseInt(avgServiceTimeRaw, 10) : 5;
        return rank * avgServiceTime;
    }
    async advanceTurn(queueId) {
        const nextTokenIds = await this.redisService.client.zpopmin(`queue:${queueId}:waiting`);
        if (!nextTokenIds || nextTokenIds.length === 0)
            return null;
        const tokenId = nextTokenIds[0];
        const token = await this.prisma.token.update({
            where: { id: tokenId },
            data: { status: client_1.TokenStatus.SERVING }
        });
        this.queueGateway.broadcastQueueUpdate(queueId, 'token_serving', { token });
        return token;
    }
    async completeToken(tokenId) {
        const token = await this.prisma.token.findUnique({ where: { id: tokenId }, include: { queue: true } });
        if (!token)
            throw new common_1.NotFoundException();
        await this.prisma.token.update({
            where: { id: tokenId },
            data: { status: client_1.TokenStatus.COMPLETED }
        });
        if (token.queue.nextQueueId) {
            await this.joinQueue(token.queue.nextQueueId, token.customerName, token.phone, token.isAppointment);
        }
        this.queueGateway.broadcastQueueUpdate(token.queueId, 'token_completed', { tokenId });
        return true;
    }
    async skipToken(tokenId) {
        const token = await this.prisma.token.update({
            where: { id: tokenId },
            data: { status: client_1.TokenStatus.MISSED }
        });
        this.queueGateway.broadcastQueueUpdate(token.queueId, 'token_missed', { tokenId });
        return token;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => queue_gateway_1.QueueGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        queue_gateway_1.QueueGateway])
], QueueService);
//# sourceMappingURL=queue.service.js.map