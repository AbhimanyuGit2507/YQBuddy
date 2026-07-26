import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard {
  private readonly limits = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const key = `${ip}:${request.route?.path || request.url}`;

    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const maxRequests = 10;

    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      throw new BadRequestException('Too many requests. Please try again later.');
    }

    return true;
  }
}
