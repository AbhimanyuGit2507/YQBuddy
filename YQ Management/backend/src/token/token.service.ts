import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TokenStatus } from '@prisma/client';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async joinQueue(queueId: string, customerName: string, phone: string) {
    const token = await this.prisma.token.create({
      data: {
        queueId,
        customerName,
        phone,
        status: TokenStatus.WAITING,
      },
    });

    // Add to Redis list (queue)
    await this.redisService.client.rpush(`queue:${queueId}:tokens`, token.id);
    
    // Broadcast event (will be handled by gateway or pubsub)
    this.redisService.client.publish('queue_events', JSON.stringify({ type: 'TOKEN_JOINED', queueId, token }));
    
    return token;
  }

  async advanceQueue(queueId: string) {
    // End the currently serving token
    const currentlyServingId = await this.redisService.client.get(`queue:${queueId}:serving`);
    if (currentlyServingId) {
      await this.prisma.token.update({
        where: { id: currentlyServingId },
        data: { status: TokenStatus.COMPLETED },
      });
    }

    // Pop the next token
    const nextTokenId = await this.redisService.client.lpop(`queue:${queueId}:tokens`);
    if (!nextTokenId) {
      await this.redisService.client.del(`queue:${queueId}:serving`);
      return null;
    }

    const nextToken = await this.prisma.token.update({
      where: { id: nextTokenId },
      data: { status: TokenStatus.SERVING },
    });

    await this.redisService.client.set(`queue:${queueId}:serving`, nextToken.id);
    this.redisService.client.publish('queue_events', JSON.stringify({ type: 'QUEUE_ADVANCED', queueId, token: nextToken }));
    
    return nextToken;
  }

  async getTokenStatus(tokenId: string) {
    const token = await this.prisma.token.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Token not found');

    if (token.status !== TokenStatus.WAITING) {
      return { token, position: 0, estimatedWaitTime: 0 };
    }

    // Find position in Redis list
    const tokens = await this.redisService.client.lrange(`queue:${token.queueId}:tokens`, 0, -1);
    const position = tokens.indexOf(tokenId) + 1;
    const estimatedWaitTime = position * 5; // 5 mins avg per person

    return { token, position, estimatedWaitTime };
  }

  async validateToken(tokenId: string) {
    const token = await this.prisma.token.findUnique({ where: { id: tokenId } });
    if (!token) return { valid: false, reason: 'Invalid Token' };

    const servingTokenId = await this.redisService.client.get(`queue:${token.queueId}:serving`);
    
    if (token.id === servingTokenId) return { valid: true, status: 'Green' };
    
    return { valid: false, status: 'Red', reason: 'Not currently serving' };
  }
}

