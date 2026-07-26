import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EvolutionApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['apikey'] || request.headers['x-api-key'];

    const expectedKey = this.configService.get<string>('EVOLUTION_API_KEY');

    if (!expectedKey || apiKey !== expectedKey) {
      throw new ForbiddenException('Invalid Evolution API key');
    }

    return true;
  }
}
