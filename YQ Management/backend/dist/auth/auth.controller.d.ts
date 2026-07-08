import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    login(body: any): Promise<{
        access_token: string;
    }>;
    register(body: Prisma.UserUncheckedCreateInput): Promise<{
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        tenantId: string;
    }>;
    googleAuth(req: any): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<void>;
    getProfile(req: any): any;
}
