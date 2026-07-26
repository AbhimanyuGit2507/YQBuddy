import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = context.getHandler().name;
    const controller = context.getClass().name;
    const ip = request.ip;
    const timestamp = new Date();

    this.logger.log(`${user?.email || 'anonymous'} ${controller}.${method} from ${ip}`);

    return next.handle().pipe(
      tap({
        error: (error) => {
          this.prisma.auditLog.create({
            data: {
              action: 'VIEW' as AuditAction,
              entity: controller,
              userId: user?.userId || null,
              workspaceId: user?.workspaceId || null,
              ipAddress: ip,
              details: { error: error.message, timestamp: timestamp.toISOString() },
            },
          }).catch(() => {});
        },
      }),
    );
  }
}