import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }[]>;
    createUser(req: any, body: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    deleteUser(req: any, id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        workspaceId: string | null;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        password: string | null;
        googleId: string | null;
        otpCode: string | null;
        otpExpiresAt: Date | null;
    }>;
    updateUserRole(req: any, id: string, body: {
        role: string;
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    toggleUserStatus(req: any, id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    transferOwnership(req: any, body: {
        newAdminId: string;
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
