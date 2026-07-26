import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CommunicationService } from '../communication/communication.service';
import { CommunicationEvent } from '../communication/events/communication-events.enum';

@Injectable()
export class SubscriptionCron {
  private readonly logger = new Logger(SubscriptionCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly communicationService: CommunicationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireTrials() {
    this.logger.log('Running trial expiration cron');
    const expired = await this.prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndDate: { lte: new Date() },
      },
      include: { workspace: { select: { id: true, name: true } } },
    });

    for (const sub of expired) {
      try {
        await this.subscriptionService.expireTrial(sub.workspaceId);
        this.logger.log(`Expired trial for workspace ${sub.workspaceId}`);
      } catch (e) {
        this.logger.error(`Failed to expire trial for workspace ${sub.workspaceId}`, e);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendRenewalReminders() {
    this.logger.log('Running renewal reminder cron');
    const upcoming = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      include: {
        workspace: { select: { id: true, name: true } },
        plan: { select: { name: true } },
      },
    });

    for (const sub of upcoming) {
      try {
        const daysRemaining = Math.ceil(
          ((sub.nextBillingDate?.getTime() || Date.now()) - Date.now()) / (24 * 60 * 60 * 1000),
        );

        await this.communicationService.publish(
          CommunicationEvent.BILLING_TRIAL_ENDING,
          {
            email: sub.workspace?.name || 'admin@example.com',
            workspaceName: sub.workspace?.name || 'Your Workspace',
            daysRemaining,
            workspaceId: sub.workspaceId,
          },
        );
        this.logger.log(`Sent renewal reminder for workspace ${sub.workspaceId}`);
      } catch (e) {
        this.logger.error(`Failed to send renewal reminder for workspace ${sub.workspaceId}`, e);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cancelExpiredSubscriptions() {
    this.logger.log('Running expired subscription cancellation cron');
    const expired = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lt: new Date() },
      },
      include: { workspace: { select: { id: true, name: true } } },
    });

    for (const sub of expired) {
      try {
        await this.subscriptionService.cancelSubscription(sub.workspaceId, {
          immediate: true,
          reason: 'Payment failed - subscription expired',
        });
        this.logger.log(`Cancelled expired subscription for workspace ${sub.workspaceId}`);
      } catch (e) {
        this.logger.error(`Failed to cancel expired subscription for workspace ${sub.workspaceId}`, e);
      }
    }
  }
}
