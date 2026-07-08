import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../tenant.service';
export interface RequestWithTenant extends Request {
    tenant: any;
}
export declare class TenantContextMiddleware implements NestMiddleware {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    use(req: RequestWithTenant, res: Response, next: NextFunction): Promise<void>;
}
