import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ThrottlerModule } from '@nestjs/throttler';

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [WebhooksController],
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: { webhookEndpoint: { findMany: jest.fn() } } },
        { provide: AuthGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        { provide: RolesGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
