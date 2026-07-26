import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingConfigService } from '../billing/config/billing-config.service';
import { ProviderRegistry } from '../billing/providers/provider-registry.service';
import { PaymentProviderName } from '@prisma/client';
import { WebhookEventType } from '@prisma/client';
import { WebhookProcessingStatus } from '@prisma/client';
import { ProcessWebhookDto } from './dto/webhook.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { PaymentsService } from '../payments/payments.service';
import { BillingException } from '../billing/errors/billing-exceptions';

@Injectable()
export class WebhookProcessService {
  private readonly logger = new Logger(WebhookProcessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: BillingConfigService,
    private readonly providerRegistry: ProviderRegistry,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async processPaymentWebhook(body: any, headers: any): Promise<{ success: boolean }> {
    const providerEventId = headers['x-ozow-event-id'] || body.id || body.eventId;
    const idempotencyKey = `ozow-${providerEventId}`;

    const existing = await this.prisma.webhookEvent.findFirst({
      where: { idempotencyKey },
    });

    if (existing) {
      this.logger.log(`Duplicate webhook detected: ${idempotencyKey}, returning 200`);
      return { success: true };
    }

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        providerEventId: providerEventId || undefined,
        provider: PaymentProviderName.OZOW,
        eventType: this.mapEventType(body.Status),
        workspaceId: body.workspaceId || undefined,
        transactionId: body.TransactionReference || undefined,
        payload: body as any,
        headers: Object.fromEntries(Object.entries(headers)) as any,
        signature: headers['x-ozow-signature'] || body.signature || undefined,
        idempotencyKey,
        processingStatus: WebhookProcessingStatus.PROCESSING,
      },
    });

    try {
      const provider = this.providerRegistry.getProvider(PaymentProviderName.OZOW);
      const sig = headers['x-ozow-signature'] || body.signature || '';
      const verification = await provider.verifyWebhook({
        payload: body as any,
        headers: Object.fromEntries(Object.entries(headers)) as any,
        signature: sig,
      });

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          signatureValid: verification.valid,
          workspaceValid: !!verification.workspaceId,
          transactionValid: !!verification.transactionId,
          amountValid: !!verification.amount,
          currencyValid: !!verification.currency,
        },
      });

      if (!verification.valid) {
        await this.prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processingStatus: WebhookProcessingStatus.FAILED,
            processingResult: 'Signature verification failed',
          },
        });
        throw new BillingException('Webhook signature verification failed');
      }

      const TransactionReference = body.TransactionReference;
      const Status = body.Status;

      if (!TransactionReference) {
        await this.prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processingStatus: WebhookProcessingStatus.FAILED,
            processingResult: 'Missing TransactionReference',
          },
        });
        throw new BillingException('Missing TransactionReference');
      }

      if (TransactionReference) {
        const transaction = await this.prisma.transaction.findFirst({
          where: { transactionRef: TransactionReference },
        });

        if (!transaction) {
          await this.prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              processingStatus: WebhookProcessingStatus.FAILED,
              processingResult: 'Transaction not found',
            },
          });
          throw new BillingException(`Transaction ${TransactionReference} not found`);
        }

        await this.prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { transactionId: transaction.id },
        });

        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: Status === 'Complete' ? 'SUCCESS' : Status === 'Cancelled' ? 'CANCELLED' : 'FAILED',
            rawProviderResponse: body,
          },
        });

        if (Status === 'Complete' && transaction.workspaceId) {
          await this.prisma.workspace.update({
            where: { id: transaction.workspaceId },
            data: { subscriptionStatus: 'ACTIVE' },
          });

          const subscription = await this.prisma.subscription.findUnique({
            where: { workspaceId: transaction.workspaceId },
          });

          if (subscription) {
            const periodDays =
              subscription.billingInterval === 'YEARLY' ? 365 : 30;
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
                nextBillingDate: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
                renewalDate: new Date(),
              },
            });
          }
        }
      }

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processingStatus: WebhookProcessingStatus.SUCCESS,
          processingResult: 'Processed successfully',
          processedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processingStatus: WebhookProcessingStatus.FAILED,
          processingResult: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      this.logger.error(`Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private mapEventType(status: string): WebhookEventType {
    const statusMap: Record<string, WebhookEventType> = {
      'Complete': WebhookEventType.PAYMENT_SUCCESS,
      'Cancelled': WebhookEventType.PAYMENT_FAILED,
      'Pending': WebhookEventType.PAYMENT_PENDING,
      'Verified': WebhookEventType.PAYMENT_SUCCESS,
      'Expired': WebhookEventType.PAYMENT_FAILED,
    };
    return statusMap[status] || WebhookEventType.PAYMENT_PENDING;
  }

  async getWebhookEvents(workspaceId: string, offset = 0, limit = 50) {
    return this.prisma.webhookEvent.findMany({
      where: { workspaceId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWebhookEvent(id: string) {
    return this.prisma.webhookEvent.findUnique({ where: { id } });
  }
}