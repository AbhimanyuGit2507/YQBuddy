import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: Prisma.UserUncheckedCreateInput) {
    // Basic validation could go here (e.g. check if tenant exists, etc.)
    return this.usersService.create(body);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { access_token } = await this.authService.login(req.user);
    // Redirect back to frontend with the token
    res.redirect(`http://localhost:3001/login?token=${access_token}`);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return req.user;
  }
}
