import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          details: details as any,
          ipAddress,
          userAgent,
        },
      });
      this.logger.log(
        `Audit: ${action} ${resource} ${resourceId || ''} by ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${action} ${resource}`,
        error,
      );
    }
  }
}
