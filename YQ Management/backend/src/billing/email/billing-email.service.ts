import { Injectable, Logger } from '@nestjs/common';
import { CommunicationService } from '../../communication/communication.service';
import { CommunicationEvent } from '../../communication/events/communication-events.enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingEmailService {
  private readonly logger = new Logger(BillingEmailService.name);

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly prisma: PrismaService,
  ) {}

  async sendWelcomeEmail(email: string, workspaceName: string) {
    await this.communicationService.publish(CommunicationEvent.MARKETING_WELCOME, {
      email,
      name: email.split('@')[0],
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
    this.logger.log(`Welcome email sent to ${email} for workspace ${workspaceName}`);
  }

  async sendPaymentSuccessEmail(email: string, workspaceName: string, amount: number, currency: string) {
    await this.communicationService.publish(CommunicationEvent.BILLING_PAYMENT_SUCCESS, {
      email,
      workspaceName,
      amount,
      currency,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendPaymentFailedEmail(email: string, workspaceName: string) {
    await this.communicationService.publish(CommunicationEvent.BILLING_PAYMENT_FAILED, {
      email,
      workspaceName,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendTrialEndingEmail(email: string, workspaceName: string, daysRemaining: number) {
    await this.communicationService.publish(CommunicationEvent.BILLING_TRIAL_ENDING, {
      email,
      workspaceName,
      daysRemaining,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendSubscriptionRenewedEmail(email: string, workspaceName: string, nextBillingDate: Date) {
    await this.communicationService.publish(CommunicationEvent.BILLING_SUBSCRIPTION_RENEWED, {
      email,
      workspaceName,
      nextBillingDate,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendSubscriptionCancelledEmail(email: string, workspaceName: string) {
    await this.communicationService.publish(CommunicationEvent.BILLING_SUBSCRIPTION_CANCELLED, {
      email,
      workspaceName,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendSubscriptionExpiredEmail(email: string, workspaceName: string) {
    await this.communicationService.publish(CommunicationEvent.BILLING_SUBSCRIPTION_EXPIRED, {
      email,
      workspaceName,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendPaymentReminderEmail(email: string, workspaceName: string, amount: number, currency: string) {
    await this.communicationService.publish(CommunicationEvent.BILLING_PAYMENT_REMINDER, {
      email,
      workspaceName,
      amount,
      currency,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  async sendVerifyEmailBeforePurchase(email: string, workspaceName: string) {
    await this.communicationService.publish(CommunicationEvent.PASSWORD_RESET_REQUESTED, {
      email,
      workspaceName,
      workspaceId: await this.getWorkspaceIdByEmail(email),
    });
  }

  private async getWorkspaceIdByEmail(email: string): Promise<string | undefined> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { workspaceId: true },
      });
      return user?.workspaceId ?? undefined;
    } catch {
      return undefined;
    }
  }
}
