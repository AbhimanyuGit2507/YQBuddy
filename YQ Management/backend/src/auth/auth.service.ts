import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateOAuthLogin(email: string, googleId: string) {
    let user = await this.usersService.findOneByEmail(email);
    
    if (!user) {
      // Create placeholder tenant for new SSO users
      // They will update this during the onboarding flow
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
        tenantId: tenant.id
      });
    } else if (!user.googleId) {
      // Link Google ID if email exists
      user = await this.usersService['prisma'].user.update({
        where: { id: user.id },
        data: { googleId }
      });
    }
    
    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
