import { TenantService } from './tenant.service';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    createTenant(body: {
        name: string;
        subdomain: string;
        branding?: any;
    }): Promise<{
        id: string;
        subdomain: string;
        name: string;
        branding: import("@prisma/client/runtime/client").JsonValue | null;
        createdAt: Date;
    }>;
    getAllTenants(): Promise<{
        id: string;
        subdomain: string;
        name: string;
        branding: import("@prisma/client/runtime/client").JsonValue | null;
        createdAt: Date;
    }[]>;
}
