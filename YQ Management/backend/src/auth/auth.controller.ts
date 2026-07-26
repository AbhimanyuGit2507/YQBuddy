import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
  Res,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from '../email/email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { LoginDto, VerifyOtpDto, RegisterDto, CreateWorkspaceDto, JoinWorkspaceDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authService.generateAndSendOTP(body.email, 'login');
    return { success: true, requiresOtp: true, email: body.email };
  }

  @UseGuards(RateLimitGuard)
  @Post('verify-login')
  async verifyLogin(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const user = await this.authService.verifyOTP(body.email, body.otp);

    const { access_token, refresh_token } = await this.authService.login(user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true, user, access_token };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const { access_token, refresh_token } = await this.authService.refreshTokens(refreshToken);
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true, access_token };
  }

  @UseGuards(RateLimitGuard)
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(body.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const newUser = await this.usersService.create({
      email: body.email,
      password: body.password,
      role: 'ADMIN',
    });

    await this.authService.generateAndSendOTP(newUser.email, 'signup');

    return { success: true, requiresOtp: true, email: newUser.email };
  }

  @UseGuards(RateLimitGuard)
  @Post('verify-signup')
  async verifySignup(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const user = await this.authService.verifyOTP(body.email, body.otp);

    this.emailService
      .addContactToMarketingList(user.email)
      .catch(console.error);

    const { access_token, refresh_token } = await this.authService.login(user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true, user };
  }

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleAuth(@Req() req: any) {
    // Initiates the Google OAuth2 login flow
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const { access_token, refresh_token } = await this.authService.login(req.user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const isNewUser = req.user.isNewUser;
    if (isNewUser) {
      res.redirect(`${frontendUrl}/onboarding`);
    } else {
      res.redirect(`${frontendUrl}/dashboard`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('workspace')
  async createWorkspace(
    @Req() req: any,
    @Body() body: CreateWorkspaceDto,
  ) {
    const workspace = await this.authService.createWorkspaceForUser(
      req.user.userId,
      body,
    );
    const updatedUser = await this.usersService['prisma'].user.findUnique({
      where: { id: req.user.userId },
      include: { workspace: true, personalSettings: true },
    });
    return { success: true, workspace, user: updatedUser };
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async joinWorkspace(@Req() req: any, @Body() body: JoinWorkspaceDto) {
    const workspace = await this.authService.joinWorkspace(
      req.user.userId,
      body.code,
    );
    const updatedUser = await this.usersService['prisma'].user.findUnique({
      where: { id: req.user.userId },
      include: { workspace: true, personalSettings: true },
    });
    return { success: true, workspace, user: updatedUser };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard)
  @Patch('personal-settings')
  async updatePersonalSettings(
    @Req() req: any,
    @Body()
    body: { theme?: string; language?: string; notificationsEnabled?: boolean },
  ) {
    const user = await this.usersService['prisma'].user.findUnique({
      where: { id: req.user.userId },
      include: { personalSettings: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.personalSettings) {
      const updated = await this.usersService['prisma'].personalSettings.update(
        {
          where: { userId: req.user.userId },
          data: body,
        },
      );
      return { success: true, settings: updated };
    }

    const created = await this.usersService['prisma'].personalSettings.create({
      data: {
        userId: req.user.userId,
        theme: body.theme || 'light',
        language: body.language || 'en',
        notificationsEnabled: body.notificationsEnabled ?? true,
      },
    });
    return { success: true, settings: created };
  }
}
