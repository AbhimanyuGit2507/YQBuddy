import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { PasswordResetService } from './password-reset.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn() } } },
        { provide: UsersService, useValue: { findOneByEmail: jest.fn(), create: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: EmailService, useValue: { sendOTP: jest.fn(), sendLoginNotification: jest.fn(), addContactToMarketingList: jest.fn() } },
        { provide: WorkspaceService, useValue: { createWorkspace: jest.fn() } },
        { provide: PasswordResetService, useValue: { requestReset: jest.fn(), resetPassword: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});