import { Test, TestingModule } from '@nestjs/testing';
import { WebhookProcessService } from '../webhook-process.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingConfigService } from '../../billing/config/billing-config.service';
import { ProviderRegistry } from '../../billing/providers/provider-registry.service';
import { SubscriptionService } from '../../subscription/subscription.service';
import { PaymentsService } from '../../payments/payments.service';
import { BillingException } from '../../billing/errors/billing-exceptions';

describe('WebhookProcessService', () => {
  let service: WebhookProcessService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = {
      webhookEvent: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workspace: {
        update: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    const configService = {
      getBackendUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    } as unknown as BillingConfigService;

    const providerRegistry = {
      getProvider: jest.fn().mockReturnValue({
        verifyWebhook: jest.fn().mockResolvedValue({ valid: true }),
      }),
    } as unknown as ProviderRegistry;

    const subscriptionService = {} as unknown as SubscriptionService;
    const paymentsService = {} as unknown as PaymentsService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookProcessService,
        { provide: PrismaService, useValue: prisma },
        { provide: BillingConfigService, useValue: configService },
        { provide: ProviderRegistry, useValue: providerRegistry },
        { provide: SubscriptionService, useValue: subscriptionService },
        { provide: PaymentsService, useValue: paymentsService },
      ],
    }).compile();

    service = module.get<WebhookProcessService>(WebhookProcessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPaymentWebhook', () => {
    it('should return success for duplicate webhook', async () => {
      prisma.webhookEvent.findFirst.mockResolvedValue({ id: 'existing' } as any);

      const result = await service.processPaymentWebhook(
        { TransactionReference: 'TXN-123', Status: 'Complete', workspaceId: 'ws-123' },
        { 'x-ozow-event-id': 'evt-1' },
      );
      expect(result.success).toBe(true);
    });

    it('should process a valid payment webhook', async () => {
      prisma.webhookEvent.findFirst.mockResolvedValue(null);
      prisma.webhookEvent.create.mockResolvedValue({ id: 'wh-1', processingStatus: 'PROCESSING' } as any);
      prisma.transaction.findFirst.mockResolvedValue({
        id: 'txn-1',
        workspaceId: 'ws-123',
        transactionRef: 'TXN-123',
      } as any);
      prisma.transaction.update.mockResolvedValue({} as any);
      prisma.workspace.update.mockResolvedValue({} as any);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        workspaceId: 'ws-123',
      } as any);
      prisma.subscription.update.mockResolvedValue({} as any);
      prisma.webhookEvent.update.mockResolvedValue({} as any);

      const result = await service.processPaymentWebhook(
        { TransactionReference: 'TXN-123', Status: 'Complete', workspaceId: 'ws-123' },
        { 'x-ozow-event-id': 'evt-1', 'x-ozow-signature': 'valid-sig' },
      );

      expect(result.success).toBe(true);
      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
    });

    it('should throw error for missing TransactionReference', async () => {
      prisma.webhookEvent.findFirst.mockResolvedValue(null);
      prisma.webhookEvent.create.mockResolvedValue({ id: 'wh-1' } as any);
      prisma.webhookEvent.update.mockResolvedValue({} as any);

      await expect(
        service.processPaymentWebhook({ Status: 'Complete' }, {}),
      ).rejects.toThrow(BillingException);

      await expect(
        service.processPaymentWebhook({}, {}),
      ).rejects.toThrow('Missing TransactionReference');
    });

    it('should mark transaction as FAILED for Cancelled status', async () => {
      prisma.webhookEvent.findFirst.mockResolvedValue(null);
      prisma.webhookEvent.create.mockResolvedValue({ id: 'wh-1' } as any);
      prisma.transaction.findFirst.mockResolvedValue({
        id: 'txn-1',
        workspaceId: 'ws-123',
        transactionRef: 'TXN-123',
      } as any);
      prisma.transaction.update.mockResolvedValue({} as any);
      prisma.webhookEvent.update.mockResolvedValue({} as any);

      await service.processPaymentWebhook(
        { TransactionReference: 'TXN-123', Status: 'Cancelled', workspaceId: 'ws-123' },
        { 'x-ozow-event-id': 'evt-1', 'x-ozow-signature': 'valid-sig' },
      );

      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });
  });
});