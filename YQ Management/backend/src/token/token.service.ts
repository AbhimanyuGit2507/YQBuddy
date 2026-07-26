import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TokenStatus, QueueStatus } from '@prisma/client';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly webhooksService: WebhooksService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async requestOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.client.set(`otp:${phone}`, otp, 'EX', 300);
    await this.notificationsService.sendWhatsAppMessage(
      phone,
      `Your Qmover verification code is: ${otp}. It expires in 5 minutes.`,
    );
    return { success: true, message: 'OTP sent' };
  }

  async joinQueue(
    queueId: string,
    customerName: string,
    phone?: string,
    otp?: string,
    formResponses?: any,
    language: string = 'en',
    scheduledFor?: string,
  ) {
    if (otp && phone) {
      const storedOtp = await this.redisService.client.get(`otp:${phone}`);
      if (!storedOtp || storedOtp !== otp) {
        throw new BadRequestException('Invalid or expired OTP');
      }
      await this.redisService.client.del(`otp:${phone}`);
    }

    let purpose: string | null = null;
    const queue = await this.prisma.queue.findUnique({
      where: { id: queueId },
    });
    if (queue && queue.formConfig && Array.isArray(queue.formConfig)) {
      const purposeField = (queue.formConfig as any[]).find(
        (f: any) =>
          (f.type === 'dropdown' || f.id === 'purpose') &&
          f.label?.toLowerCase().includes('purpose'),
      );
      if (
        purposeField &&
        purposeField.id &&
        formResponses &&
        formResponses[purposeField.id]
      ) {
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
        status: TokenStatus.WAITING,
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
      this.redisService.client.publish(
        'queue_events',
        JSON.stringify({ type: 'TOKEN_JOINED', queueId, token }),
      );
    } else {
      this.redisService.client.publish(
        'queue_events',
        JSON.stringify({ type: 'APPOINTMENT_CREATED', queueId, token }),
      );
    }

    if (phone) {
      const appUrl = process.env.APP_URL || 'http://localhost:3001';
      if (isAppointment) {
        await this.notificationsService.sendWhatsAppMessage(
          phone,
          `Hello ${customerName}! Your appointment is scheduled for ${scheduledDate?.toLocaleString()}. Track your status here: ${appUrl}/customer/status/${token.id}`,
          queue?.workspaceId,
        );
      } else {
        await this.notificationsService.sendWhatsAppMessage(
          phone,
          `Hello ${customerName}! You have successfully joined the queue. You can track your live status here: ${appUrl}/customer/status/${token.id}`,
          queue?.workspaceId,
        );
      }
    }

    return token;
  }

  async advanceQueue(queueId: string) {
    const currentlyServingId = await this.redisService.client.get(
      `queue:${queueId}:serving`,
    );
    if (currentlyServingId) {
      const updatedToken = await this.prisma.token.update({
        where: { id: currentlyServingId },
        data: {
          status: TokenStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: { queue: true },
      });
      if (updatedToken.phone) {
        await this.whatsappService.requestFeedback(
          updatedToken.queue.workspaceId,
          updatedToken.phone,
          updatedToken.language,
        );
      }
    }

    const nextTokenId = await this.redisService.client.lpop(
      `queue:${queueId}:tokens`,
    );
    if (!nextTokenId) {
      await this.redisService.client.del(`queue:${queueId}:serving`);
      return null;
    }

    const nextToken = await this.prisma.token.update({
      where: { id: nextTokenId },
      data: {
        status: TokenStatus.SERVING,
        servedAt: new Date(),
      },
    });

    await this.redisService.client.set(
      `queue:${queueId}:serving`,
      nextToken.id,
    );
    this.redisService.client.publish(
      'queue_events',
      JSON.stringify({ type: 'QUEUE_ADVANCED', queueId, token: nextToken }),
    );

    if (nextToken.phone) {
      await this.notificationsService.sendWhatsAppMessage(
        nextToken.phone,
        `Hi ${nextToken.customerName}, it is your turn now! Please proceed to the counter.`,
        nextToken.queueId,
      );
    }

    const upcomingTokenId = await this.redisService.client.lindex(
      `queue:${queueId}:tokens`,
      0,
    );
    if (upcomingTokenId) {
      const upcomingToken = await this.prisma.token.findUnique({
        where: { id: upcomingTokenId },
      });
      if (upcomingToken && upcomingToken.phone) {
        await this.notificationsService.sendWhatsAppMessage(
          upcomingToken.phone,
          `Hi ${upcomingToken.customerName}, you are next in line! Get ready.`,
          upcomingToken.queueId,
        );
      }
    }

    return nextToken;
  }

  async getTokenStatus(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: true },
    });
    if (!token) throw new NotFoundException('Token not found');

    if (token.status !== TokenStatus.WAITING) {
      return { token, position: 0, estimatedWaitTime: 0 };
    }

    if (token.isAppointment && !token.checkedIn) {
      return { token, position: 0, estimatedWaitTime: 0, isScheduled: true };
    }

    const tokens = await this.redisService.client.lrange(
      `queue:${token.queueId}:tokens`,
      0,
      -1,
    );
    const position = tokens.indexOf(tokenId) + 1;

    let avgServiceTime = 5;

    if (token.purpose) {
      const cacheKey = `queue:${token.queueId}:purpose:${token.purpose}:avg_time`;
      const cachedTime = await this.redisService.client.get(cacheKey);

      if (cachedTime) {
        avgServiceTime = parseInt(cachedTime, 10);
      } else {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const completedTokens = await this.prisma.token.findMany({
          where: {
            queueId: token.queueId,
            purpose: token.purpose,
            status: TokenStatus.COMPLETED,
            completedAt: { not: null },
            servedAt: { not: null, gte: sevenDaysAgo },
          },
          select: { servedAt: true, completedAt: true },
        });

        if (completedTokens.length > 0) {
          const totalDiff = completedTokens.reduce((acc, t) => {
            return acc + (t.completedAt!.getTime() - t.servedAt!.getTime());
          }, 0);
          avgServiceTime = Math.max(
            1,
            Math.floor(totalDiff / completedTokens.length / 60000),
          );
        }

        await this.redisService.client.set(
          cacheKey,
          avgServiceTime.toString(),
          'EX',
          600,
        );
      }
    }

    const estimatedWaitTime = position * avgServiceTime;

    return { token, position, estimatedWaitTime };
  }

  async validateToken(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      include: { queue: { select: { name: true, workspaceId: true } } },
    });
    if (!token) return { valid: false, reason: 'Invalid Token' };

    const servingTokenId = await this.redisService.client.get(
      `queue:${token.queueId}:serving`,
    );

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

  async cancelToken(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });
    if (!token) throw new NotFoundException('Token not found');

    if (token.status === TokenStatus.WAITING) {
      await this.redisService.client.lrem(
        `queue:${token.queueId}:tokens`,
        0,
        tokenId,
      );
    }

    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: { status: TokenStatus.MISSED },
    });

    this.redisService.client.publish(
      'queue_events',
      JSON.stringify({
        type: 'TOKEN_CANCELLED',
        queueId: token.queueId,
        token: updatedToken,
      }),
    );

    const queue = await this.prisma.queue.findUnique({
      where: { id: token.queueId },
    });
    if (queue) {
      this.webhooksService.triggerWebhooks(
        queue.workspaceId,
        'TOKEN_CANCELLED',
        updatedToken,
      );
    }

    return updatedToken;
  }

  async transferToken(tokenId: string, nextQueueId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });
    if (!token) throw new NotFoundException('Token not found');

    if (token.queueId === nextQueueId) {
      throw new BadRequestException('Cannot transfer token to the same queue');
    }

    const nextQueue = await this.prisma.queue.findUnique({
      where: { id: nextQueueId },
    });
    if (!nextQueue) {
      throw new NotFoundException('Target queue not found');
    }

    if (nextQueue.status !== QueueStatus.ACTIVE) {
      throw new BadRequestException('Target queue is not active');
    }

    const servingTokenId = await this.redisService.client.get(
      `queue:${token.queueId}:serving`,
    );
    if (servingTokenId === tokenId) {
      await this.redisService.client.del(`queue:${token.queueId}:serving`);
    } else if (token.status === TokenStatus.WAITING) {
      await this.redisService.client.lrem(
        `queue:${token.queueId}:tokens`,
        0,
        tokenId,
      );
    }

    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        queueId: nextQueueId,
        status: TokenStatus.WAITING,
        joinedAt: new Date(),
        servedAt: null,
      },
    });

    await this.redisService.client.rpush(
      `queue:${nextQueueId}:tokens`,
      updatedToken.id,
    );

    this.redisService.client.publish(
      'queue_events',
      JSON.stringify({
        type: 'TOKEN_TRANSFERRED',
        oldQueueId: token.queueId,
        newQueueId: nextQueueId,
        token: updatedToken,
      }),
    );

    const queue = await this.prisma.queue.findUnique({
      where: { id: token.queueId },
    });
    if (queue) {
      this.webhooksService.triggerWebhooks(
        queue.workspaceId,
        'TOKEN_TRANSFERRED',
        updatedToken,
      );
    }

    if (updatedToken.phone) {
      const newQueue = await this.prisma.queue.findUnique({
        where: { id: nextQueueId },
      });
      await this.notificationsService.sendWhatsAppMessage(
        updatedToken.phone,
        `You have been transferred to ${newQueue?.name}. You are now waiting in the new queue.`,
        newQueue?.workspaceId,
      );
    }

    return updatedToken;
  }

  async checkIn(tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
    });
    if (!token) throw new NotFoundException('Token not found');
    if (token.checkedIn || token.status !== TokenStatus.WAITING) return token;

    const updatedToken = await this.prisma.token.update({
      where: { id: tokenId },
      data: { checkedIn: true, joinedAt: new Date() },
    });

    await this.redisService.client.rpush(
      `queue:${token.queueId}:tokens`,
      updatedToken.id,
    );
    this.redisService.client.publish(
      'queue_events',
      JSON.stringify({
        type: 'TOKEN_JOINED',
        queueId: token.queueId,
        token: updatedToken,
      }),
    );

    if (updatedToken.phone) {
      await this.notificationsService.sendWhatsAppMessage(
        updatedToken.phone,
        `Hello ${updatedToken.customerName}! You have been checked in and are now waiting in the live line.`,
        token.queueId,
      );
    }
    return updatedToken;
  }
}
