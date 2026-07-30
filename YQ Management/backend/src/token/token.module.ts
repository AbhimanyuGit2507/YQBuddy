import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { QueueModule } from '../queue/queue.module';
import { AppointmentCron } from './appointment.cron';

@Module({
  imports: [NotificationsModule, WebhooksModule, WhatsappModule, QueueModule],
  providers: [TokenService, AppointmentCron],
  controllers: [TokenController],
})
export class TokenModule {}
