import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueGateway } from './queue.gateway';
import { WebhooksService } from '../webhooks/webhooks.service';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: PrismaService, useValue: { queue: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() } } },
        { provide: RedisService, useValue: { client: { zadd: jest.fn(), zpopmin: jest.fn(), zrange: jest.fn(), zrem: jest.fn(), get: jest.fn(), set: jest.fn(), hget: jest.fn(), hset: jest.fn() } } },
        { provide: QueueGateway, useValue: { broadcastQueueUpdate: jest.fn(), broadcastTenantUpdate: jest.fn() } },
        { provide: WebhooksService, useValue: { triggerWebhooks: jest.fn() } },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});