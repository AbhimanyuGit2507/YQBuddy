import { PrismaService } from '../prisma/prisma.service';
export declare class TenantService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTenantBySubdomain(subdomain: string): Promise<{
        id: string;
        subdomain: string;
        name: string;
        branding: import("@prisma/client/runtime/client").JsonValue | null;
        createdAt: Date;
    }>;
    createTenant(data: {
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
