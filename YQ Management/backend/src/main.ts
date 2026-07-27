import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Logger, LoggerModule } from 'nestjs-pino';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis/redis-io.adapter';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { EnvValidation } from './config/env.validation';
import { BodySizeMiddleware } from './common/middleware/body-size.middleware';

async function bootstrap() {
  const envValidation = new EnvValidation();
  envValidation.validate();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(cookieParser());
  app.use(
    new BodySizeMiddleware(1024 * 1024).use.bind(new BodySizeMiddleware()),
  );

  app.enableCors({
    origin: (origin: string, callback: any) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:3001',
        'http://localhost:3000',
        'https://qmover.vercel.app',
      ].filter(Boolean);

      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  } as any);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const server = await app.listen(process.env.PORT ?? 3000);

  const logger = app.get(Logger);
  logger.log(`Server started on port ${process.env.PORT ?? 3000}`);

  process.on('SIGTERM', () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      logger.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
      logger.log('Server closed');
      process.exit(0);
    });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error(
      { error: error.message, stack: error.stack },
      'Uncaught exception',
    );
    process.exit(1);
  });
}
bootstrap();
