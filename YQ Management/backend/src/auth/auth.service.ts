import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {}

  private generateOTP(): string {
    if (process.env.TEST_MODE === 'true') {
      return '000000';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
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
        otpExpiresAt: expiresAt
      }
    });

    await this.emailService.sendOTP(email, otp, purpose);
  }

  async verifyOTP(email: string, otp: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP
    await this.usersService['prisma'].user.update({
      where: { email },
      data: {
        otpCode: null,
        otpExpiresAt: null
      }
    });

    // Fire and forget login notification
    this.emailService.sendLoginNotification(email).catch(console.error);

    return user;
  }

  async validateOAuthLogin(email: string, googleId: string) {
    try {
      let user = await this.usersService.findOneByEmail(email);
      let isNewUser = false;
      
      if (!user) {
        isNewUser = true;
        // Create placeholder tenant for new SSO users
        const tenant = await this.usersService['prisma'].tenant.create({
          data: {
            name: 'My Company',
            subdomain: `temp-${Date.now()}`,
          }
        });

        user = await this.usersService.create({
          email,
          googleId,
          role: 'TENANT_ADMIN',
          tenantId: tenant.id,
        });
        
        // Sync to marketing
        this.emailService.addContactToMarketingList(email).catch(console.error);
      } else if (!user.googleId) {
        // Link Google ID if email exists
        user = await this.usersService['prisma'].user.update({
          where: { id: user.id },
          data: { googleId }
        });
      }
      
      return { ...user, isNewUser };
    } catch (error) {
      console.error('Error in validateOAuthLogin:', error);
      throw error;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
