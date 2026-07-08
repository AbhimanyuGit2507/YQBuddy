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
const client_1 = require("@prisma/client");
let TokenService = class TokenService {
    prisma;
    redisService;
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async joinQueue(queueId, customerName, phone) {
        const token = await this.prisma.token.create({
            data: {
                queueId,
                customerName,
                phone,
                status: client_1.TokenStatus.WAITING,
            },
        });
        await this.redisService.client.rpush(`queue:${queueId}:tokens`, token.id);
        this.redisService.client.publish('queue_events', JSON.stringify({ type: 'TOKEN_JOINED', queueId, token }));
        return token;
    }
    async advanceQueue(queueId) {
        const currentlyServingId = await this.redisService.client.get(`queue:${queueId}:serving`);
        if (currentlyServingId) {
            await this.prisma.token.update({
                where: { id: currentlyServingId },
                data: { status: client_1.TokenStatus.COMPLETED },
            });
        }
        const nextTokenId = await this.redisService.client.lpop(`queue:${queueId}:tokens`);
        if (!nextTokenId) {
            await this.redisService.client.del(`queue:${queueId}:serving`);
            return null;
        }
        const nextToken = await this.prisma.token.update({
            where: { id: nextTokenId },
            data: { status: client_1.TokenStatus.SERVING },
        });
        await this.redisService.client.set(`queue:${queueId}:serving`, nextToken.id);
        this.redisService.client.publish('queue_events', JSON.stringify({ type: 'QUEUE_ADVANCED', queueId, token: nextToken }));
        return nextToken;
    }
    async getTokenStatus(tokenId) {
        const token = await this.prisma.token.findUnique({ where: { id: tokenId } });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        if (token.status !== client_1.TokenStatus.WAITING) {
            return { token, position: 0, estimatedWaitTime: 0 };
        }
        const tokens = await this.redisService.client.lrange(`queue:${token.queueId}:tokens`, 0, -1);
        const position = tokens.indexOf(tokenId) + 1;
        const estimatedWaitTime = position * 5;
        return { token, position, estimatedWaitTime };
    }
    async validateToken(tokenId) {
        const token = await this.prisma.token.findUnique({ where: { id: tokenId } });
        if (!token)
            return { valid: false, reason: 'Invalid Token' };
        const servingTokenId = await this.redisService.client.get(`queue:${token.queueId}:serving`);
        if (token.id === servingTokenId)
            return { valid: true, status: 'Green' };
        return { valid: false, status: 'Red', reason: 'Not currently serving' };
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], TokenService);
//# sourceMappingURL=token.service.js.map