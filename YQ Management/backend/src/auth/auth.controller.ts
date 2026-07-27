import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from '../email/email.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService
  ) {}

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Instead of logging in, generate and send OTP
    await this.authService.generateAndSendOTP(body.email, 'login');
    return { success: true, requiresOtp: true, email: body.email };
  }

  @Post('verify-login')
  async verifyLogin(@Body() body: { email: string; otp: string }, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.verifyOTP(body.email, body.otp);
    
    const { access_token } = await this.authService.login(user);
    
    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    return { success: true, user, access_token };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('register')
  async register(@Body() body: any) {
    // Check if email already in use
    const existingUser = await this.usersService.findOneByEmail(body.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Create placeholder tenant for new signups
    const tenant = await this.usersService['prisma'].tenant.create({
      data: {
        name: 'My Company',
        subdomain: `temp-${Date.now()}`,
      }
    });

    const newUser = await this.usersService.create({
      email: body.email,
      password: body.password,
      role: 'TENANT_ADMIN',
      tenantId: tenant.id
    });

    // Generate and send OTP for verification
    await this.authService.generateAndSendOTP(newUser.email, 'signup');
    
    return { success: true, requiresOtp: true, email: newUser.email };
  }

  @Post('verify-signup')
  async verifySignup(@Body() body: { email: string; otp: string }, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.verifyOTP(body.email, body.otp);
    
    // Add to Brevo marketing list
    this.emailService.addContactToMarketingList(user.email).catch(console.error);

    const { access_token } = await this.authService.login(user);
    
    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return { success: true, user };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const { access_token } = await this.authService.login(req.user);
    
    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const isNewUser = req.user.isNewUser;
    if (isNewUser) {
      res.redirect(`http://localhost:3001/onboarding`);
    } else {
      res.redirect(`http://localhost:3001/dashboard`);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return req.user;
  }
}
