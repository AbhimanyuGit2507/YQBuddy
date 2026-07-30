import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    let callbackURL: string;
    if (isProduction) {
      callbackURL = 'https://qmover.vercel.app/auth/google/callback';
    } else {
      callbackURL = 'http://localhost:3000/auth/google/callback';
    }

    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') || 'mock-client-id',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
        'mock-client-secret',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.sub || profile.id;

    if (!email) {
      return done(new Error('No email found in Google profile'));
    }

    const user = await this.authService.validateOAuthLogin(email, googleId);
    done(null, user);
  }
}
