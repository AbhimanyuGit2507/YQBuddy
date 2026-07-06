import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../tenant.service';

export interface RequestWithTenant extends Request {
  tenant: any;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: RequestWithTenant, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (!host) {
      throw new BadRequestException('Host header is missing');
    }

    const manualSubdomain = req.headers['x-tenant-subdomain'] as string;
    let subdomain = manualSubdomain;

    if (!subdomain) {
      const parts = host.split('.');
      if (parts.length > 1) {
        subdomain = parts[0];
      }
    }

    if (!subdomain) {
      throw new BadRequestException('Subdomain or x-tenant-subdomain header is required');
    }

    try {
      const tenant = await this.tenantService.getTenantBySubdomain(subdomain);
      req.tenant = tenant;
      next();
    } catch (err) {
      next(err);
    }
  }
}
