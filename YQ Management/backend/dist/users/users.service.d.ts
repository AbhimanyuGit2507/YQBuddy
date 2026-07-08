import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOneByEmail(email: string): Promise<{
        id: string;
        email: string;
        tenantId: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
    } | null>;
    create(data: Prisma.UserUncheckedCreateInput): Promise<{
        id: string;
        email: string;
        tenantId: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
