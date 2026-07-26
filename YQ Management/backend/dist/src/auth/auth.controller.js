"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const passport_1 = require("@nestjs/passport");
const email_service_1 = require("../email/email.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const workspace_guard_1 = require("../auth/workspace.guard");
const rate_limit_guard_1 = require("./rate-limit.guard");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    authService;
    usersService;
    emailService;
    constructor(authService, usersService, emailService) {
        this.authService = authService;
        this.usersService = usersService;
        this.emailService = emailService;
    }
    async login(body, res) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.authService.generateAndSendOTP(body.email, 'login');
        return { success: true, requiresOtp: true, email: body.email };
    }
    async verifyLogin(body, res) {
        const user = await this.authService.verifyOTP(body.email, body.otp);
        const { access_token, refresh_token } = await this.authService.login(user);
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { success: true, user, access_token };
    }
    async logout(res) {
        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });
        return { success: true, message: 'Logged out successfully' };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken)
            throw new common_1.UnauthorizedException('No refresh token');
        const { access_token, refresh_token } = await this.authService.refreshTokens(refreshToken);
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { success: true, access_token };
    }
    async register(body) {
        const existingUser = await this.usersService.findOneByEmail(body.email);
        if (existingUser) {
            throw new common_1.UnauthorizedException('Email already in use');
        }
        const newUser = await this.usersService.create({
            email: body.email,
            password: body.password,
            role: 'ADMIN',
        });
        await this.authService.generateAndSendOTP(newUser.email, 'signup');
        return { success: true, requiresOtp: true, email: newUser.email };
    }
    async verifySignup(body, res) {
        const user = await this.authService.verifyOTP(body.email, body.otp);
        this.emailService
            .addContactToMarketingList(user.email)
            .catch(console.error);
        const { access_token, refresh_token } = await this.authService.login(user);
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { success: true, user };
    }
    async googleAuth(req) {
    }
    async googleAuthRedirect(req, res) {
        const { access_token, refresh_token } = await this.authService.login(req.user);
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const isNewUser = req.user.isNewUser;
        if (isNewUser) {
            res.redirect(`${frontendUrl}/onboarding`);
        }
        else {
            res.redirect(`${frontendUrl}/dashboard`);
        }
    }
    async createWorkspace(req, body) {
        const workspace = await this.authService.createWorkspaceForUser(req.user.userId, body);
        const updatedUser = await this.usersService['prisma'].user.findUnique({
            where: { id: req.user.userId },
            include: { workspace: true, personalSettings: true },
        });
        return { success: true, workspace, user: updatedUser };
    }
    async joinWorkspace(req, body) {
        const workspace = await this.authService.joinWorkspace(req.user.userId, body.code);
        const updatedUser = await this.usersService['prisma'].user.findUnique({
            where: { id: req.user.userId },
            include: { workspace: true, personalSettings: true },
        });
        return { success: true, workspace, user: updatedUser };
    }
    getProfile(req) {
        return req.user;
    }
    async updatePersonalSettings(req, body) {
        const user = await this.usersService['prisma'].user.findUnique({
            where: { id: req.user.userId },
            include: { personalSettings: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.personalSettings) {
            const updated = await this.usersService['prisma'].personalSettings.update({
                where: { userId: req.user.userId },
                data: body,
            });
            return { success: true, settings: updated };
        }
        const created = await this.usersService['prisma'].personalSettings.create({
            data: {
                userId: req.user.userId,
                theme: body.theme || 'light',
                language: body.language || 'en',
                notificationsEnabled: body.notificationsEnabled ?? true,
            },
        });
        return { success: true, settings: created };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)('verify-login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyLogin", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)('verify-signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifySignup", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, common_1.Get)('google/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('workspace'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.CreateWorkspaceDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createWorkspace", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.JoinWorkspaceDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "joinWorkspace", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), workspace_guard_1.WorkspaceGuard),
    (0, common_1.Patch)('personal-settings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updatePersonalSettings", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService,
        email_service_1.EmailService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map