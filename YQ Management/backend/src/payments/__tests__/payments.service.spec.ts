import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingConfigService } from '../../billing/config/billing-config.service';
import { ProviderRegistry } from '../../billing/providers/provider-registry.service';
import { NotFoundException } from '@nestjs/common';
import { PaymentProviderName } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let configService: BillingConfigService;
  let providerRegistry: ProviderRegistry;

  beforeEach(async () => {
    prisma = {
      plan: {
        findUnique: jest.fn(),
      },
      provider: {
        findFirst: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      workspace: {
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    configService = {
      getBackendUrl: jest.fn().mockReturnValue('http://localhost:3000'),
      getFrontendUrl: jest.fn().mockReturnValue('http://localhost:3001'),
    } as unknown as BillingConfigService;

    providerRegistry = {
      getProvider: jest.fn(),
    } as unknown as ProviderRegistry;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: BillingConfigService, useValue: configService },
        { provide: ProviderRegistry, useValue: providerRegistry },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckout', () => {
    it('should create a checkout session for an active plan', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Basic',
        status: 'ACTIVE',
        price: 29.99,
        currency: 'ZAR',
        billingInterval: 'MONTHLY',
      };

      prisma.plan.findUnique.mockResolvedValue(mockPlan as any);
      providerRegistry.getProvider.mockReturnValue({
        createCheckout: jest.fn().mockResolvedValue({
          checkoutUrl: 'https://sandbox.ozow.com/checkout',
          paymentReference: 'INR-123',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          providerTransactionId: 'TXN-123',
        }),
      });
      prisma.transaction.create.mockResolvedValue({} as any);

      const result = await service.createCheckout(
        { planId: 'plan-1', amount: 29.99 },
        'ws-123',
      );
      expect(result.paymentReference).toBe('INR-123');
    });

    it('should throw NotFoundException for non-existent plan', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);
      await expect(
        service.createCheckout({ planId: 'nonexistent' }, 'ws-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive plan', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Inactive',
        status: 'INACTIVE',
        price: 0,
      };
      prisma.plan.findUnique.mockResolvedValue(mockPlan as any);
      await expect(
        service.createCheckout({ planId: 'plan-1' }, 'ws-123'),
      ).rejects.toThrow('Plan Inactive is not active');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return transaction by reference', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 'txn-1',
        transactionRef: 'TXN-123',
        internalRef: 'INR-123',
        amount: 29.99,
        currency: 'ZAR',
        status: 'SUCCESS',
        workspaceId: 'ws-123',
        paymentProvider: PaymentProviderName.OZOW,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workspace.findUnique = jest
        .fn()
        .mockResolvedValue({ name: 'Test Workspace' } as any);

      const result = await service.getPaymentStatus('TXN-123');
      expect(result.status).toBe('SUCCESS');
      expect(result.amount).toBe(29.99);
    });

    it('should throw NotFoundException for missing transaction', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      await expect(service.getPaymentStatus('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction list for workspace', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { id: 'txn-1', amount: 29.99, status: 'SUCCESS' },
      ] as any);

      const result = await service.getTransactionHistory('ws-123');
      expect(result).toHaveLength(1);
    });
  });
});
