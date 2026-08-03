import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import createLogRoutingTransport from './config/log-routing';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';
import { KeepAliveService } from './health/keep-alive.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppService } from './app.service';
import { TenantModule } from './tenant/tenant.module';
import { PrismaModule } from './prisma/prisma.module';
import { TenantContextMiddleware } from './tenant/middlewares/tenant-context/tenant-context.middleware';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { TokenModule } from './token/token.module';
import { RedisModule } from './redis/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PaymentsModule } from './payments/payments.module';
import { PlansModule } from './plans/plans.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { EmailModule } from './email/email.module';
import { CommunicationModule } from './communication/communication.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MessagesModule } from './messages/messages.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        stream: createLogRoutingTransport(),
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
    TenantModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    QueueModule,
    TokenModule,
    RedisModule,
    NotificationsModule,
    WhatsappModule,
    PaymentsModule,
    PlansModule,
    SuperAdminModule,
    EmailModule,
    CommunicationModule,
    WebhooksModule,
    AnalyticsModule,
    MessagesModule,
    WorkspaceModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    KeepAliveService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    consumer
      .apply(TenantContextMiddleware)
      .exclude('/health', '/auth/*path')
      .forRoutes('*');
  }
}
