import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { Queue } from 'bullmq';
import { WhatsappService } from '../whatsapp/whatsapp.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: 'BullQueue_whatsapp', useValue: { add: jest.fn() } },
        { provide: WhatsappService, useValue: { sendTemplate: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
