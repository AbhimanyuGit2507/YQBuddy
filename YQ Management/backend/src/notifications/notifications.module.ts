import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

import { BullModule } from '@nestjs/bullmq';
import { WhatsappProcessor } from './whatsapp.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'whatsapp',
    }),
  ],
  providers: [NotificationsService, WhatsappProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}
