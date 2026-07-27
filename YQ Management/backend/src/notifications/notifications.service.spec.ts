import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { BullModule } from '@nestjs/bullmq';
import { CommunicationLogService } from '../communication/logging/communication-log.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: 'WhatsAppProvider',
          useValue: {
            sendText: jest.fn(() =>
              Promise.resolve({ success: true, providerId: 'mock' }),
            ),
          },
        },
        {
          provide: CommunicationLogService,
          useValue: {
            log: jest.fn(() => Promise.resolve()),
          },
        },
      ],
      imports: [BullModule.registerQueue({ name: 'whatsapp' })],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
