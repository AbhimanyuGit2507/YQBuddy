import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappProcessor } from './whatsapp.processor';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    CommunicationModule,
    BullModule.registerQueue({
      name: 'whatsapp',
    }),
  ],
  providers: [NotificationsService, WhatsappProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
