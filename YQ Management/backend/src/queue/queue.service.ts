import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueStatus, TokenStatus } from '@prisma/client';
import { QueueGateway } from './queue.gateway';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => QueueGateway))
    private readonly queueGateway: QueueGateway,
    private readonly webhooksService: WebhooksService,
  ) {}

  async createQueue(
    tenantId: string,
    workspaceId: string | undefined,
    name: string,
    formConfig?: any,
  ) {
    const queue = await this.prisma.queue.create({
      data: {
        tenantId,
        workspaceId,
        name,
        status: QueueStatus.ACTIVE,
        formConfig,
      },
    });

    await this.redisService.client.hset(`queue:${queue.id}:state`, {
      status: QueueStatus.ACTIVE,
      name: queue.name,
    });
    return queue;
  }

  async updateQueue(
    queueId: string,
    data: {
      name?: string;
      formConfig?: any;
      nextQueueId?: string | null;
      allowAppointments?: boolean;
      requireManualCheckIn?: boolean;
      appointmentGranularityMins?: number;
    },
  ) {
    return this.prisma.queue.update({
      where: { id: queueId },
      data,
    });
  }

  async updateQueueForTenant(
    queueId: string,
    tenantId: string,
    data: {
      name?: string;
      formConfig?: any;
      nextQueueId?: string | null;
      allowAppointments?: boolean;
      requireManualCheckIn?: boolean;
      appointmentGranularityMins?: number;
    },
  ) {
    const queue = await this.prisma.queue.findFirst({
      where: { id: queueId, tenantId },
    });

    if (!queue) {
      throw new NotFoundException('Queue not found');
    }

    return this.prisma.queue.update({
      where: { id: queueId },
      data,
    });
  }

  async getQueuesForTenant(tenantId: string) {
    return this.prisma.queue.findMany({
      where: { tenantId },
      include: { _count: { select: { tokens: true } } },
    });
  }

  async getQueueById(id: string) {
    return this.prisma.queue.findUnique({
      where: { id },
    });
  }

  async getQueueByIdForTenant(id: string, tenantId: string) {
    const queue = await this.prisma.queue.findFirst({
      where: { id, tenantId },
    });

    if (!queue) {
      throw new NotFoundException('Queue not found');
    }

    return queue;
  }

  async getQueueTokens(queueId: string) {
    return this.prisma.token.findMany({
      where: {
        queueId,
        status: { in: [TokenStatus.WAITING, TokenStatus.SERVING] },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getQueueTokensForTenant(queueId: string, tenantId: string) {
    await this.getQueueByIdForTenant(queueId, tenantId);
    return this.getQueueTokens(queueId);
  }

  async getHistory(tenantId: string) {
    return this.prisma.token.findMany({
      where: {
        queue: { tenantId },
        status: { in: [TokenStatus.COMPLETED, TokenStatus.MISSED] },
      },
      include: { queue: true },
      orderBy: { joinedAt: 'desc' },
      take: 100, // Limit for MVP
    });
  }

  async updateQueueStatus(queueId: string, status: QueueStatus) {
    const queue = await this.prisma.queue.update({
      where: { id: queueId },
      data: { status },
    });
    await this.redisService.client.hset(
      `queue:${queue.id}:state`,
      'status',
      status,
    );

    this.queueGateway.broadcastQueueUpdate(queueId, 'queue_status_changed', {
      status,
    });
    return queue;
  }

  async updateQueueStatusForTenant(
    queueId: string,
    tenantId: string,
    status: QueueStatus,
  ) {
    await this.getQueueByIdForTenant(queueId, tenantId);
    return this.updateQueueStatus(queueId, status);
  }

  // --- Advanced Queue Logic ---

  async joinQueue(
    queueId: string,
    customerName: string,
    phone: string | null,
    isAppointment = false,
  ) {
    const token = await this.prisma.token.create({
      data: {
        queueId,
        customerName,
        phone,
        status: TokenStatus.WAITING,
        isAppointment,
      },
    });

    // Add to Redis sorted set for position tracking (score is timestamp)
    await this.redisService.client.zadd(
      `queue:${queueId}:waiting`,
      Date.now(),
      token.id,
    );

    this.queueGateway.broadcastQueueUpdate(queueId, 'token_joined', { token });
    const queue = await this.prisma.queue.findUnique({
      where: { id: queueId },
    });
    if (queue) {
      this.webhooksService.triggerWebhooks(
        queue.tenantId,
        'TOKEN_JOINED',
        token,
      );
    }
    return token;
  }

  async getEstimatedWaitTime(queueId: string, tokenId: string) {
    const rank = await this.redisService.client.zrank(
      `queue:${queueId}:waiting`,
      tokenId,
    );
    if (rank === null) return 0; // Not waiting

    // Dynamic EWT: average service time of last 10 customers
    const avgServiceTimeRaw = await this.redisService.client.get(
      `queue:${queueId}:avg_time`,
    );
    const avgServiceTime = avgServiceTimeRaw
      ? parseInt(avgServiceTimeRaw, 10)
      : 5; // Default 5 mins

    return rank * avgServiceTime;
  }

  async advanceTurn(queueId: string) {
    // Pop the lowest score (oldest) from waiting set
    const nextTokenIds = await this.redisService.client.zpopmin(
      `queue:${queueId}:waiting`,
    );
    if (!nextTokenIds || nextTokenIds.length === 0) return null;

    const tokenId = nextTokenIds[0];

    // Update DB
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: TokenStatus.SERVING,
        servedAt: new Date(),
      },
    });

    // Broadcast
    this.queueGateway.broadcastQueueUpdate(queueId, 'token_serving', { token });
    const queue = await this.prisma.queue.findUnique({
      where: { id: queueId },
    });
    if (queue) {
      this.webhooksService.triggerWebhooks(
        queue.tenantId,
        'TOKEN_SERVING',
        token,
      );
    }
    return token;
  }

  async completeToken(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: true },
    });
    if (!token) throw new NotFoundException();

    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: TokenStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.redisService.client.zrem(
      `queue:${updatedToken.queueId}:waiting`,
      tokenId,
    );

    if (updatedToken.servedAt && updatedToken.completedAt) {
      const diffMs =
        updatedToken.completedAt.getTime() - updatedToken.servedAt.getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));

      const currentAvgRaw = await this.redisService.client.get(
        `queue:${updatedToken.queueId}:avg_time`,
      );
      let newAvg = diffMins;
      if (currentAvgRaw) {
        newAvg = Math.max(
          1,
          Math.floor((parseInt(currentAvgRaw, 10) * 9 + diffMins) / 10),
        ); // Exponential moving average over ~10 customers
      }
      await this.redisService.client.set(
        `queue:${updatedToken.queueId}:avg_time`,
        newAvg,
      );
    }

    // Multi-step routing logic
    if (token.queue.nextQueueId) {
      await this.joinQueue(
        token.queue.nextQueueId,
        token.customerName,
        token.phone,
        token.isAppointment,
      );
    }

    this.queueGateway.broadcastQueueUpdate(token.queueId, 'token_completed', {
      tokenId,
    });
    this.webhooksService.triggerWebhooks(
      token.queue.tenantId,
      'TOKEN_COMPLETED',
      token,
    );
    return true;
  }

  async skipToken(tokenId: string) {
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: TokenStatus.MISSED },
      include: { queue: true },
    });

    await this.redisService.client.zrem(
      `queue:${token.queueId}:waiting`,
      tokenId,
    );

    this.queueGateway.broadcastQueueUpdate(token.queueId, 'token_missed', {
      tokenId,
    });
    this.webhooksService.triggerWebhooks(
      token.queue.tenantId,
      'TOKEN_MISSED',
      token,
    );
    return token;
  }
}
