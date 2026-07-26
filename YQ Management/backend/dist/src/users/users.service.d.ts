import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOneByEmail(email: string): Promise<({
        personalSettings: {
            id: string;
            userId: string;
            theme: string;
            language: string;
            notificationsEnabled: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        workspace: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            subdomain: string;
            branding: Prisma.JsonValue | null;
            whatsappInstanceId: string | null;
            whatsappConnected: boolean;
            whatsappPhone: string | null;
            chatbotEnabled: boolean;
            chatbotConfig: Prisma.JsonValue | null;
            subscriptionStatus: string;
        } | null;
    } & {
        id: string;
        email: string;
        googleId: string | null;
        workspaceId: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        otpCode: string | null;
        otpExpiresAt: Date | null;
    }) | null>;
    create(data: Prisma.UserUncheckedCreateInput): Promise<{
        id: string;
        email: string;
        googleId: string | null;
        workspaceId: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        otpCode: string | null;
        otpExpiresAt: Date | null;
    }>;
    getUsersByWorkspace(workspaceId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
    }[]>;
    createUser(workspaceId: string, data: {
        email: string;
        role: any;
        password?: string;
    }): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    deleteUser(workspaceId: string, id: string, currentUserId: string): Promise<{
        id: string;
        email: string;
        googleId: string | null;
        workspaceId: string | null;
        password: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        otpCode: string | null;
        otpExpiresAt: Date | null;
    }>;
    updateUserRole(workspaceId: string, userId: string, newRole: string, currentUserId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    toggleUserStatus(workspaceId: string, userId: string, currentUserId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    transferOwnership(workspaceId: string, currentUserId: string, newAdminId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    getWorkspaceAdmins(workspaceId: string): Promise<{
        id: string;
        email: string;
    }[]>;
}
