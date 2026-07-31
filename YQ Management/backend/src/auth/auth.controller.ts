import {
  Controller,
  Post,
  Body,
  Patch,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from '../email/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PasswordResetService } from './password-reset.service';
import type { AuthenticatedRequest } from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authService.generateAndSendOTP(body.email, 'login');
    return { success: true, requiresOtp: true, email: body.email };
  }

  @UseGuards(ThrottlerGuard)
  @Post('verify-login')
  async verifyLogin(
    @Body() body: { email: string; otp: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const user = await this.authService.verifyOTP(body.email, body.otp);

    const { access_token } = await this.authService.login(user);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { success: true, user, access_token };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(@Body() body: any) {
    const existingUser = await this.usersService.findOneByEmail(body.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const newUser = await this.authService.registerUser(
      body.email,
      body.password,
    );

    await this.authService.generateAndSendOTP(newUser.email, 'signup');

    return { success: true, requiresOtp: true, email: newUser.email };
  }

  @UseGuards(ThrottlerGuard)
  @Post('verify-signup')
  async verifySignup(
    @Body() body: { email: string; otp: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const user = await this.authService.verifyOTP(body.email, body.otp);

    this.emailService
      .addContactToMarketingList(user.email)
      .catch((err) =>
        new Logger(AuthController.name).error(
          'Failed to add contact to marketing list',
          err,
        ),
      );

    const { access_token } = await this.authService.login(user);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const isNewUser = req.user.isNewUser;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    if (isNewUser) {
      res.redirect(`${frontendUrl}/onboarding`);
    } else {
      res.redirect(`${frontendUrl}/dashboard`);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('personal-settings')
  async updatePersonalSettings(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: { theme?: string; language?: string; notificationsEnabled?: boolean },
  ) {
    const updates: any = {};
    if (body.theme !== undefined)
      updates.personalSettings = {
        ...req.user.personalSettings,
        theme: body.theme,
      };
    if (body.language !== undefined)
      updates.personalSettings = {
        ...updates.personalSettings,
        language: body.language,
      };
    if (body.notificationsEnabled !== undefined)
      updates.personalSettings = {
        ...updates.personalSettings,
        notificationsEnabled: body.notificationsEnabled,
      };

    const updatedUser = await this.usersService['prisma'].user.update({
      where: { id: req.user.sub },
      data: updates,
      select: { id: true, email: true, role: true, personalSettings: true },
    });

    return { success: true, user: updatedUser };
  }

  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.passwordResetService.requestReset(body.email);
  }

  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.passwordResetService.resetPassword(body.token, body.password);
  }
}
