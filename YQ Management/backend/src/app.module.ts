import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkspaceModule } from './workspace/workspace.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspaceContextMiddleware } from './workspace/middlewares/workspace-context/workspace-context.middleware';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { TokenModule } from './token/token.module';
import { RedisModule } from './redis/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { EmailModule } from './email/email.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MessagesModule } from './messages/messages.module';
import { PermissionsModule } from './permissions/permissions.module';
import { InvitationModule } from './invitation/invitation.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { InvoiceModule } from './invoice/invoice.module';
import { UsageModule } from './usage/usage.module';
import { CommunicationModule } from './communication/communication.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: { singleLine: true },
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    ScheduleModule.forRoot(),
    WorkspaceModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    QueueModule,
    TokenModule,
    RedisModule,
    NotificationsModule,
    WhatsappModule,
    SuperAdminModule,
    EmailModule,
    AnalyticsModule,
    MessagesModule,
    PermissionsModule,
    InvitationModule,
    PlansModule,
    SubscriptionModule,
    InvoiceModule,
    UsageModule,
    CommunicationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WorkspaceContextMiddleware)
      .exclude('/health', '/auth/(.*)')
      .forRoutes('*');
  }
}