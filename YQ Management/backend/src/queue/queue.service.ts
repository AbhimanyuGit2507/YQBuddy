import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueStatus, TokenStatus } from '@prisma/client';
import { QueueGateway } from './queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => QueueGateway))
    private readonly queueGateway: QueueGateway
  ) {}

  async createQueue(tenantId: string, name: string) {
    const queue = await this.prisma.queue.create({
      data: { tenantId, name, status: QueueStatus.ACTIVE },
    });
    
    await this.redisService.client.hset(`queue:${queue.id}:state`, {
      status: QueueStatus.ACTIVE,
      name: queue.name,
    });
    return queue;
  }

  async getQueuesForTenant(tenantId: string) {
    return this.prisma.queue.findMany({
      where: { tenantId },
      include: { _count: { select: { tokens: true } } },
    });
  }

  async updateQueueStatus(queueId: string, status: QueueStatus) {
    const queue = await this.prisma.queue.update({
      where: { id: queueId },
      data: { status },
    });
    await this.redisService.client.hset(`queue:${queue.id}:state`, 'status', status);
    
    this.queueGateway.broadcastQueueUpdate(queueId, 'queue_status_changed', { status });
    return queue;
  }

  // --- Advanced Queue Logic ---

  async joinQueue(queueId: string, customerName: string, phone: string, isAppointment = false) {
    const token = await this.prisma.token.create({
      data: {
        queueId,
        customerName,
        phone,
        status: TokenStatus.WAITING,
        isAppointment
      }
    });

    // Add to Redis sorted set for position tracking (score is timestamp)
    await this.redisService.client.zadd(`queue:${queueId}:waiting`, Date.now(), token.id);
    
    this.queueGateway.broadcastQueueUpdate(queueId, 'token_joined', { token });
    return token;
  }

  async getEstimatedWaitTime(queueId: string, tokenId: string) {
    const rank = await this.redisService.client.zrank(`queue:${queueId}:waiting`, tokenId);
    if (rank === null) return 0; // Not waiting

    // Dynamic EWT: average service time of last 10 customers
    const avgServiceTimeRaw = await this.redisService.client.get(`queue:${queueId}:avg_time`);
    const avgServiceTime = avgServiceTimeRaw ? parseInt(avgServiceTimeRaw, 10) : 5; // Default 5 mins

    return rank * avgServiceTime;
  }

  async advanceTurn(queueId: string) {
    // Pop the lowest score (oldest) from waiting set
    const nextTokenIds = await this.redisService.client.zpopmin(`queue:${queueId}:waiting`);
    if (!nextTokenIds || nextTokenIds.length === 0) return null;

    const tokenId = nextTokenIds[0];
    
    // Update DB
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: TokenStatus.SERVING }
    });

    // Broadcast
    this.queueGateway.broadcastQueueUpdate(queueId, 'token_serving', { token });
    return token;
  }

  async completeToken(tokenId: string) {
    const token = await this.prisma.token.findUnique({ where: { id: tokenId }, include: { queue: true }});
    if (!token) throw new NotFoundException();

    await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: TokenStatus.COMPLETED }
    });

    // Multi-step routing logic
    if (token.queue.nextQueueId) {
      await this.joinQueue(token.queue.nextQueueId, token.customerName, token.phone, token.isAppointment);
    }

    this.queueGateway.broadcastQueueUpdate(token.queueId, 'token_completed', { tokenId });
    return true;
  }

  async skipToken(tokenId: string) {
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: TokenStatus.MISSED }
    });
    this.queueGateway.broadcastQueueUpdate(token.queueId, 'token_missed', { tokenId });
    return token;
  }
}
