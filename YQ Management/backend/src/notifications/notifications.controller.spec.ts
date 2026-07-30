import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: 'BullQueue_whatsapp', useValue: { add: jest.fn() } },
        { provide: Queue, useValue: { add: jest.fn() } },
        { provide: WhatsappService, useValue: { sendTemplate: jest.fn() } },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
