import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantController', () => {
  let controller: TenantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        TenantService,
        { provide: PrismaService, useValue: { tenant: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() } } },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});