import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { QueueService } from '../queue/queue.service';
import { TemplateService } from '../communication/templates/template.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: PrismaService,
          useValue: {
            token: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
            queue: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
        { provide: RedisService, useValue: { client: { get: jest.fn(), set: jest.fn(), zadd: jest.fn(), zpopmin: jest.fn(), zrange: jest.fn(), zrem: jest.fn(), del: jest.fn(), keys: jest.fn(), hexists: jest.fn(), hget: jest.fn(), hset: jest.fn(), lpush: jest.fn(), lpop: jest.fn(), rpush: jest.fn(), expire: jest.fn(), subscribe: jest.fn(), publish: jest.fn(), on: jest.fn() } } },
        { provide: NotificationsService, useValue: {} },
        { provide: WebhooksService, useValue: { triggerWebhooks: jest.fn() } },
        { provide: WhatsappService, useValue: {} },
        { provide: QueueService, useValue: {} },
        { provide: TemplateService, useValue: { renderWhatsAppForWorkspace: jest.fn() } },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});