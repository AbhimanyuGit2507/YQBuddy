import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIT_KEY } from './audit.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const audit = this.reflector.getAllAndOverride<{
      action: string;
      resource: string;
    }>(AUDIT_KEY, [context.getHandler(), context.getClass()]);

    if (!audit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user?.userId || 'anonymous';

    return next.handle().pipe(
      tap((response) => {
        const resourceId = response?.id || request.params?.id;
        this.prisma.auditLog
          .create({
            data: {
              userId,
              action: audit.action,
              resource: audit.resource,
              resourceId,
              details: { response } as any,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            },
          })
          .catch((error) => {
            this.logger.error(
              `Failed to create audit log: ${audit.action} ${audit.resource}`,
              error,
            );
          });
      }),
    );
  }
}
