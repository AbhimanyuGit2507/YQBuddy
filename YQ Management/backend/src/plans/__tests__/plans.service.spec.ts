import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from '../plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PlansService', () => {
  let service: PlansService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = {
      plan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PlansService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listPlans', () => {
    it('should return a list of plans', async () => {
      const mockPlans = [
        { id: '1', name: 'Basic', status: 'ACTIVE' },
        { id: '2', name: 'Pro', status: 'ACTIVE' },
      ];
      prisma.plan.findMany.mockResolvedValue(mockPlans as any);

      const result = await service.listPlans();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Basic');
    });

    it('should filter by status', async () => {
      const mockPlans = [{ id: '1', name: 'Basic', status: 'ACTIVE' }];
      prisma.plan.findMany.mockResolvedValue(mockPlans as any);

      const result = await service.listPlans('ACTIVE');
      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } }),
      );
    });
  });

  describe('getPlan', () => {
    it('should return a plan by id', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: '1',
        name: 'Basic',
      } as any);
      const result = await service.getPlan('1');
      expect(result.name).toBe('Basic');
    });

    it('should throw NotFoundException for non-existent plan', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);
      await expect(service.getPlan('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPlan', () => {
    it('should create a plan with valid data', async () => {
      const dto = {
        name: 'Enterprise Plan',
        description: 'Enterprise tier',
        type: 'ENTERPRISE',
        billingInterval: 'MONTHLY',
        price: 99.99,
        currency: 'ZAR',
        trialDays: 14,
      };
      prisma.plan.create.mockResolvedValue({ id: '1', ...dto } as any);

      const result = await service.createPlan(dto as any);
      expect(result.name).toBe('Enterprise Plan');
      expect(prisma.plan.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining(dto) }),
      );
    });
  });

  describe('updatePlan', () => {
    it('should update a plan', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: '1',
        name: 'Basic',
      } as any);
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Updated Basic',
      } as any);

      const result = await service.updatePlan('1', {
        name: 'Updated Basic',
      });
      expect(result.name).toBe('Updated Basic');
    });
  });

  describe('changePlanStatus', () => {
    it('should change plan status', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: '1',
        name: 'Basic',
      } as any);
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Basic',
        status: 'INACTIVE',
      } as any);

      const result = await service.changePlanStatus('1', 'INACTIVE');
      expect(result.status).toBe('INACTIVE');
    });
  });

  describe('duplicatePlan', () => {
    it('should duplicate a plan', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: '1',
        name: 'Basic',
        description: 'Basic plan',
        type: 'STANDARD',
        billingInterval: 'MONTHLY',
        price: 29.99,
        currency: 'ZAR',
        trialDays: 7,
        status: 'ACTIVE',
        sortOrder: 0,
      } as any);
      prisma.plan.create.mockResolvedValue({
        id: '2',
        name: 'Copy of Basic',
      } as any);

      const result = await service.duplicatePlan('1', 'Copy of Basic');
      expect(result.name).toBe('Copy of Basic');
    });
  });

  describe('archivePlan', () => {
    it('should archive a plan', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: '1',
        name: 'Basic',
      } as any);
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Basic',
        status: 'ARCHIVED',
      } as any);

      const result = await service.archivePlan('1');
      expect(result.status).toBe('ARCHIVED');
    });
  });
});
