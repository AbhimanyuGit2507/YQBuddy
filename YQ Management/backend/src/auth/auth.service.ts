import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  private generateOTP(): string {
    if (process.env.TEST_MODE === 'true') {
      return '000000';
    }
    const { randomInt } = require('crypto');
    return randomInt(100000, 999999).toString();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async generateAndSendOTP(email: string, purpose: 'signup' | 'login') {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.usersService['prisma'].user.update({
      where: { email },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
      },
    });

    await this.emailService.sendOTP(email, otp, purpose);
  }

  async verifyOTP(email: string, otp: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (
      !user ||
      user.otpCode !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.usersService['prisma'].user.update({
      where: { email },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    this.emailService.sendLoginNotification(email).catch((err) => {
      this.logger.warn(
        { error: err?.message || err },
        'Failed to send login notification email',
      );
    });

    return user;
  }

  async validateOAuthLogin(email: string, googleId: string) {
    try {
      let user: any = await this.usersService.findOneByEmail(email);
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        const created = await this.usersService.create({
          email,
          googleId,
          role: 'OPERATOR',
        });
        user = created as any;

        this.emailService.addContactToMarketingList(email).catch((err) => {
          this.logger.warn(
            { error: err?.message || err },
            'Failed to add contact to marketing list',
          );
        });
      } else if (!user.googleId) {
        user = await this.usersService['prisma'].user.update({
          where: { id: user.id },
          data: { googleId },
          include: { workspace: true, personalSettings: true },
        });
      }

      return { ...user, isNewUser };
    } catch (error) {
      this.logger.error(
        { error: error.message, stack: error.stack },
        'Error in validateOAuthLogin',
      );
      throw error;
    }
  }

  async createWorkspaceForUser(
    userId: string,
    data: { name: string; subdomain: string; branding?: any },
  ) {
    const user = await this.usersService['prisma'].user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.workspaceId) {
      throw new ConflictException('User already belongs to a workspace');
    }

    const existingWorkspace = await this.prisma.workspace.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existingWorkspace) {
      throw new ConflictException('Subdomain already taken');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        branding: data.branding,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { workspaceId: workspace.id, role: 'ADMIN' },
    });

    return workspace;
  }

  async joinWorkspace(userId: string, code: string) {
    const user = await this.usersService['prisma'].user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.workspaceId) {
      throw new ConflictException('User already belongs to a workspace');
    }

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        code: code.toUpperCase(),
        revoked: false,
      },
    });

    if (
      !invitation ||
      invitation.usedCount >= invitation.maxUses ||
      invitation.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired invitation code');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    // Add user to workspace
    await this.prisma.user.update({
      where: { id: userId },
      data: { workspaceId: workspace.id, role: invitation.role },
    });

    // Increment used count
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedCount: { increment: 1 } },
    });

    return workspace;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      workspaceId: user.workspaceId,
    };
    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: process.env.JWT_SECRET, expiresIn: '7d' },
    );
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { access_token, refresh_token: refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET!,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh')
      throw new UnauthorizedException('Invalid token type');
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (!stored)
      throw new UnauthorizedException('Refresh token not found or expired');
    const match = await bcrypt.compare(refreshToken, stored.token);
    if (!match) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const newPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      workspaceId: user.workspaceId,
    };
    const access_token = this.jwtService.sign(newPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: process.env.JWT_SECRET, expiresIn: '7d' },
    );
    const hashedNew = await bcrypt.hash(newRefreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        token: hashedNew,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { access_token, refresh_token: newRefreshToken };
  }
}
