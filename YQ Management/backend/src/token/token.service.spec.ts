import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { CommunicationModule } from '../communication/communication.module';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenService],
      imports: [
        PrismaModule,
        RedisModule,
        NotificationsModule,
        WebhooksModule,
        WhatsappModule,
        CommunicationModule,
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
