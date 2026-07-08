import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
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
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TenantModule, PrismaModule, UsersModule, AuthModule, QueueModule, TokenModule, RedisModule, NotificationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .exclude('/health')
      .forRoutes('*');
  }
}
