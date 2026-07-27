import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvValidation {
  validate() {
    const required = [
      'JWT_SECRET',
      'EVOLUTION_API_KEY',
      'DATABASE_URL',
      'REDIS_HOST',
      'REDIS_PORT',
      'OZOW_SITE_CODE',
      'OZOW_PRIVATE_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }

    if ((process.env.JWT_SECRET || '').length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security',
      );
    }

    if ((process.env.EVOLUTION_API_KEY || '').length < 16) {
      throw new Error('EVOLUTION_API_KEY must be at least 16 characters long');
    }
  }
}
