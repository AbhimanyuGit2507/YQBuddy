import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from '../subscription.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: PrismaService;

  const mockWorkspaceId = 'ws-123';
  const mockPlanId = 'plan-1';

  beforeEach(async () => {
    prisma = {
      plan: {
        findUnique: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      workspace: {
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscription', () => {
    it('should return subscription for workspace', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        planId: mockPlanId,
        status: SubscriptionStatus.ACTIVE,
      } as any);

      const result = await service.getSubscription(mockWorkspaceId);
      expect(result).toBeDefined();
      expect(result!.workspaceId).toBe(mockWorkspaceId);
    });

    it('should return null if no subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      const result = await service.getSubscription('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: mockPlanId,
        name: 'Basic',
        status: 'ACTIVE',
        active: true,
        billingInterval: 'MONTHLY',
        trialDays: 7,
        price: 29.99,
      } as any);

      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        planId: mockPlanId,
        status: SubscriptionStatus.PENDING_PAYMENT,
      } as any);

      prisma.workspace.update.mockResolvedValue({} as any);

      const result = await service.createSubscription(mockWorkspaceId, {
        planId: mockPlanId,
        billingInterval: 'MONTHLY',
      });

      expect(result.status).toBe(SubscriptionStatus.PENDING_PAYMENT);
      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockWorkspaceId },
          data: { subscriptionStatus: SubscriptionStatus.PENDING_PAYMENT },
        }),
      );
    });

    it('should throw if workspace already has subscription', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: mockPlanId,
        name: 'Basic',
        status: 'ACTIVE',
        active: true,
      } as any);
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'existing',
      } as any);
      await expect(
        service.createSubscription(mockWorkspaceId, { planId: mockPlanId }),
      ).rejects.toThrow('Workspace already has an active subscription');
    });

    it('should throw if plan not found', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);
      await expect(
        service.createSubscription(mockWorkspaceId, { planId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startFreeTrial', () => {
    it('should start a free trial', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: mockPlanId,
        billingInterval: 'MONTHLY',
      } as any);
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        planId: mockPlanId,
        status: SubscriptionStatus.TRIAL,
        trialDays: 14,
      } as any);
      prisma.workspace.update.mockResolvedValue({} as any);

      const result = await service.startFreeTrial(
        mockWorkspaceId,
        mockPlanId,
        14,
      );
      expect(result.status).toBe(SubscriptionStatus.TRIAL);
      expect(result.trialDays).toBe(14);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        planId: mockPlanId,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: 'MONTHLY',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any);

      prisma.subscription.update.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        status: SubscriptionStatus.CANCELLED,
      } as any);
      prisma.workspace.update.mockResolvedValue({} as any);

      const result = await service.cancelSubscription(mockWorkspaceId, {
        immediate: true,
      });
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('renewSubscription', () => {
    it('should renew a subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        planId: mockPlanId,
        billingInterval: 'MONTHLY',
      } as any);

      prisma.subscription.update.mockResolvedValue({
        id: 'sub-1',
        workspaceId: mockWorkspaceId,
        status: SubscriptionStatus.ACTIVE,
      } as any);
      prisma.workspace.update.mockResolvedValue({} as any);

      const result = await service.renewSubscription(mockWorkspaceId);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
