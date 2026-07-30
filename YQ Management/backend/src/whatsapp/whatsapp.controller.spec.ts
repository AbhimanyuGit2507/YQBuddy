import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { Queue } from 'bullmq';

describe('WhatsappController', () => {
  let controller: WhatsappController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [WhatsappController],
      providers: [
        WhatsappService,
        { provide: PrismaService, useValue: {} },
        { provide: RedisService, useValue: { client: { get: jest.fn(), set: jest.fn(), zadd: jest.fn(), zpopmin: jest.fn(), zrange: jest.fn(), zrem: jest.fn(), del: jest.fn(), keys: jest.fn(), hexists: jest.fn(), hget: jest.fn(), hset: jest.fn(), lpush: jest.fn(), lpop: jest.fn(), rpush: jest.fn(), expire: jest.fn(), subscribe: jest.fn(), publish: jest.fn(), on: jest.fn() } } },
        { provide: AuthGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        { provide: RolesGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        { provide: WorkspaceGuard, useValue: { canActivate: jest.fn().mockResolvedValue(true) } },
        { provide: Queue, useValue: { add: jest.fn() } },
      ],
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
