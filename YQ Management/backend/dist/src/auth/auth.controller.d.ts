import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto, VerifyOtpDto, RegisterDto, CreateWorkspaceDto, JoinWorkspaceDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    private readonly emailService;
    constructor(authService: AuthService, usersService: UsersService, emailService: EmailService);
    login(body: LoginDto, res: any): Promise<{
        success: boolean;
        requiresOtp: boolean;
        email: string;
    }>;
    verifyLogin(body: VerifyOtpDto, res: any): Promise<{
        success: boolean;
        user: {
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
                name: string;
                subdomain: string;
                branding: import("@prisma/client/runtime/client").JsonValue | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                whatsappInstanceId: string | null;
                whatsappConnected: boolean;
                whatsappPhone: string | null;
                chatbotEnabled: boolean;
                chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
                subscriptionStatus: string;
            } | null;
        } & {
            email: string;
            password: string | null;
            id: string;
            googleId: string | null;
            workspaceId: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.UserStatus;
            otpCode: string | null;
            otpExpiresAt: Date | null;
        };
        access_token: string;
    }>;
    logout(res: any): Promise<{
        success: boolean;
        message: string;
    }>;
    refresh(req: any, res: any): Promise<{
        success: boolean;
        access_token: string;
    }>;
    register(body: RegisterDto): Promise<{
        success: boolean;
        requiresOtp: boolean;
        email: string;
    }>;
    verifySignup(body: VerifyOtpDto, res: any): Promise<{
        success: boolean;
        user: {
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
                name: string;
                subdomain: string;
                branding: import("@prisma/client/runtime/client").JsonValue | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                whatsappInstanceId: string | null;
                whatsappConnected: boolean;
                whatsappPhone: string | null;
                chatbotEnabled: boolean;
                chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
                subscriptionStatus: string;
            } | null;
        } & {
            email: string;
            password: string | null;
            id: string;
            googleId: string | null;
            workspaceId: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.UserStatus;
            otpCode: string | null;
            otpExpiresAt: Date | null;
        };
    }>;
    googleAuth(req: any): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<void>;
    createWorkspace(req: any, body: CreateWorkspaceDto): Promise<{
        success: boolean;
        workspace: {
            name: string;
            subdomain: string;
            branding: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            whatsappInstanceId: string | null;
            whatsappConnected: boolean;
            whatsappPhone: string | null;
            chatbotEnabled: boolean;
            chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
            subscriptionStatus: string;
        };
        user: ({
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
                name: string;
                subdomain: string;
                branding: import("@prisma/client/runtime/client").JsonValue | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                whatsappInstanceId: string | null;
                whatsappConnected: boolean;
                whatsappPhone: string | null;
                chatbotEnabled: boolean;
                chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
                subscriptionStatus: string;
            } | null;
        } & {
            email: string;
            password: string | null;
            id: string;
            googleId: string | null;
            workspaceId: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.UserStatus;
            otpCode: string | null;
            otpExpiresAt: Date | null;
        }) | null;
    }>;
    joinWorkspace(req: any, body: JoinWorkspaceDto): Promise<{
        success: boolean;
        workspace: {
            name: string;
            subdomain: string;
            branding: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            whatsappInstanceId: string | null;
            whatsappConnected: boolean;
            whatsappPhone: string | null;
            chatbotEnabled: boolean;
            chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
            subscriptionStatus: string;
        };
        user: ({
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
                name: string;
                subdomain: string;
                branding: import("@prisma/client/runtime/client").JsonValue | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                whatsappInstanceId: string | null;
                whatsappConnected: boolean;
                whatsappPhone: string | null;
                chatbotEnabled: boolean;
                chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
                subscriptionStatus: string;
            } | null;
        } & {
            email: string;
            password: string | null;
            id: string;
            googleId: string | null;
            workspaceId: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.UserStatus;
            otpCode: string | null;
            otpExpiresAt: Date | null;
        }) | null;
    }>;
    getProfile(req: any): any;
    updatePersonalSettings(req: any, body: {
        theme?: string;
        language?: string;
        notificationsEnabled?: boolean;
    }): Promise<{
        success: boolean;
        settings: {
            id: string;
            userId: string;
            theme: string;
            language: string;
            notificationsEnabled: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
