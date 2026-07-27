import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AppointmentCron } from './appointment.cron';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    NotificationsModule,
    WebhooksModule,
    WhatsappModule,
    AuthModule,
  ],
  providers: [TokenService, AppointmentCron],
  controllers: [TokenController],
  exports: [TokenService],
})
export class TokenModule {}
