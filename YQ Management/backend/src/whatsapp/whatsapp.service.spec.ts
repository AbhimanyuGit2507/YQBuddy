import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('WhatsappService', () => {
  let service: WhatsappService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: PrismaService,
          useValue: {
            whatsapp: { findUnique: jest.fn(), update: jest.fn() },
            tenant: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: RedisService,
          useValue: {
            client: {
              get: jest.fn(),
              set: jest.fn(),
              del: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateValidationCode', () => {
    it('should generate and store a validation code', async () => {
      const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenant.update as jest.Mock).mockResolvedValue(mockTenant);

      const result = await service.generateValidationCode('tenant-1');

      expect(result).toHaveProperty('validationCode');
      expect(result.validationCode).toMatch(/^WVC-[A-Z0-9]+-[A-Z0-9]{8}$/);
      expect(result.expiresIn).toBe(60);
      expect(redis.client.set).toHaveBeenCalledWith(
        'whatsapp:validation-code:tenant-1',
        expect.any(String),
        'EX',
        60,
      );
    });

    it('should throw if tenant not found', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.generateValidationCode('tenant-1')).rejects.toThrow('Tenant not found');
    });
  });

  describe('connectWithValidationCode', () => {
    it('should throw if tenant not found', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.connectWithValidationCode('tenant-1', 'WVC-TEST')).rejects.toThrow('Tenant not found');
    });

    it('should throw if validation code is invalid', async () => {
      const mockTenant = { id: 'tenant-1', name: 'Test Tenant', whatsappInstanceId: null };
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (redis.client.get as jest.Mock).mockResolvedValue(null);

      await expect(service.connectWithValidationCode('tenant-1', 'INVALID')).rejects.toThrow('Invalid or expired validation code');
    });
  });
});