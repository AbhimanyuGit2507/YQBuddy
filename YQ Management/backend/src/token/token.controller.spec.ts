import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { QueueService } from '../queue/queue.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { TemplateService } from '../communication/templates/template.service';

describe('TokenController', () => {
  let controller: TokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [TokenController],
      providers: [
        TokenService,
        { provide: PrismaService, useValue: { token: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() }, queue: { findUnique: jest.fn() } } },
        { provide: RedisService, useValue: { client: { get: jest.fn(), set: jest.fn(), zadd: jest.fn(), zpopmin: jest.fn(), zrange: jest.fn(), zrem: jest.fn() } } },
        { provide: NotificationsService, useValue: { sendTokenNotification: jest.fn() } },
        { provide: WebhooksService, useValue: { triggerWebhooks: jest.fn() } },
        { provide: WhatsappService, useValue: { sendMessage: jest.fn() } },
        { provide: QueueService, useValue: { advanceTurn: jest.fn() } },
        { provide: 'BullQueue_whatsapp', useValue: { add: jest.fn() } },
        { provide: TemplateService, useValue: { renderWhatsAppForWorkspace: jest.fn() } },
      ],
    }).compile();

    controller = module.get<TokenController>(TokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
