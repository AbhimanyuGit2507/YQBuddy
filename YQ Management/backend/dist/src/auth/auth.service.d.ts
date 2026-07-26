import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private emailService;
    private prisma;
    constructor(usersService: UsersService, jwtService: JwtService, emailService: EmailService, prisma: PrismaService);
    private generateOTP;
    validateUser(email: string, pass: string): Promise<any>;
    generateAndSendOTP(email: string, purpose: 'signup' | 'login'): Promise<void>;
    verifyOTP(email: string, otp: string): Promise<{
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
            branding: import("@prisma/client/runtime/client").JsonValue | null;
            whatsappInstanceId: string | null;
            whatsappConnected: boolean;
            whatsappPhone: string | null;
            chatbotEnabled: boolean;
            chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
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
    }>;
    validateOAuthLogin(email: string, googleId: string): Promise<any>;
    createWorkspaceForUser(userId: string, data: {
        name: string;
        subdomain: string;
        branding?: any;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        subdomain: string;
        branding: import("@prisma/client/runtime/client").JsonValue | null;
        whatsappInstanceId: string | null;
        whatsappConnected: boolean;
        whatsappPhone: string | null;
        chatbotEnabled: boolean;
        chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
        subscriptionStatus: string;
    }>;
    joinWorkspace(userId: string, code: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        subdomain: string;
        branding: import("@prisma/client/runtime/client").JsonValue | null;
        whatsappInstanceId: string | null;
        whatsappConnected: boolean;
        whatsappPhone: string | null;
        chatbotEnabled: boolean;
        chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
        subscriptionStatus: string;
    }>;
    login(user: any): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
}
