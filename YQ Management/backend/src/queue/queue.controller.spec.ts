import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('QueueController', () => {
  let controller: QueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [QueueController],
      providers: [
        QueueService,
        QueueGateway,
        { provide: PrismaService, useValue: { queue: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), _count: { select: jest.fn() } } } },
        { provide: RedisService, useValue: { client: { get: jest.fn(), set: jest.fn(), zadd: jest.fn(), zpopmin: jest.fn(), zrange: jest.fn(), zrem: jest.fn() } } },
        { provide: WebhooksService, useValue: { triggerWebhooks: jest.fn() } },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
