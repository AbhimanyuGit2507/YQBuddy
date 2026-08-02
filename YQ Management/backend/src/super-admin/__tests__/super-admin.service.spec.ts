import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminService } from '../super-admin.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = {
      tenant: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      transaction: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      token: {
        count: jest.fn(),
      },
      queue: {
        count: jest.fn(),
      },
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subscription: {
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      plan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      workspace: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SuperAdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGlobalMetrics', () => {
    it('should return global metrics', async () => {
      prisma.tenant.count.mockResolvedValue(5);
      prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
      prisma.token.count.mockResolvedValue(50);
      prisma.queue.count.mockResolvedValue(10);
      prisma.user.count.mockResolvedValue(20);

      const result = await service.getGlobalMetrics();
      expect(result.totalTenants).toBe(5);
      expect(result.totalRevenue).toBe(1000);
      expect(result.totalCustomersServed).toBe(50);
      expect(result.activeQueues).toBe(10);
      expect(result.totalUsers).toBe(20);
    });
  });

  describe('getAllTenants', () => {
    it('should return all tenants', async () => {
      prisma.tenant.findMany.mockResolvedValue([
        { id: '1', name: 'Tenant 1' },
      ] as any);

      const result = await service.getAllTenants();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tenant 1');
    });

    it('should filter tenants by search', async () => {
      prisma.tenant.findMany.mockResolvedValue([] as any);

      await service.getAllTenants({ search: 'test' });
      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'test', mode: 'insensitive' } },
        }),
      );
    });
  });

  describe('getTenantById', () => {
    it('should return a tenant by id', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: '1',
        name: 'Test Tenant',
        users: [],
        workspaces: [],
        transactions: [],
      } as any);

      const result = await service.getTenantById('1');
      expect(result.name).toBe('Test Tenant');
    });
  });

  describe('listPlans', () => {
    it('should return a list of plans', async () => {
      prisma.plan.findMany.mockResolvedValue([
        { id: '1', name: 'Basic', active: true },
        { id: '2', name: 'Pro', active: true },
      ] as any);

      const result = await service.listPlans();
      expect(result).toHaveLength(2);
    });

    it('should filter plans by status', async () => {
      prisma.plan.findMany.mockResolvedValue([
        { id: '1', name: 'Basic', active: true },
      ] as any);

      const result = await service.listPlans('ACTIVE');
      expect(prisma.plan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
      expect(result).toHaveLength(1);
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

      const result = await service.createPlan(dto);
      expect(result.name).toBe('Enterprise Plan');
      expect(prisma.plan.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining(dto) }),
      );
    });
  });

  describe('updatePlan', () => {
    it('should update a plan', async () => {
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Updated Plan',
      } as any);

      const result = await service.updatePlan('1', { name: 'Updated Plan' });
      expect(result.name).toBe('Updated Plan');
    });
  });

  describe('archivePlan', () => {
    it('should archive a plan', async () => {
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Basic',
        active: false,
      } as any);

      await service.archivePlan('1');
      expect(prisma.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { active: false },
        }),
      );
    });
  });

  describe('changePlanStatus', () => {
    it('should change plan status to ACTIVE', async () => {
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Basic',
        active: true,
      } as any);

      await service.changePlanStatus('1', 'ACTIVE');
      expect(prisma.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { active: true },
        }),
      );
    });

    it('should change plan status to INACTIVE', async () => {
      prisma.plan.update.mockResolvedValue({
        id: '1',
        name: 'Basic',
        active: false,
      } as any);

      await service.changePlanStatus('1', 'INACTIVE');
      expect(prisma.plan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { active: false },
        }),
      );
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
        active: true,
        sortOrder: 0,
      } as any);
      prisma.plan.create.mockResolvedValue({
        id: '2',
        name: 'Copy of Basic',
      } as any);

      const result = await service.duplicatePlan('1', 'Copy of Basic');
      expect(result.name).toBe('Copy of Basic');
      expect(prisma.plan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Copy of Basic' }),
        }),
      );
    });
  });
});