"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    emailService;
    prisma;
    constructor(usersService, jwtService, emailService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.prisma = prisma;
    }
    generateOTP() {
        if (process.env.TEST_MODE === 'true') {
            return '000000';
        }
        const { randomInt } = require('crypto');
        return randomInt(100000, 999999).toString();
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findOneByEmail(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async generateAndSendOTP(email, purpose) {
        const otp = this.generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.usersService['prisma'].user.update({
            where: { email },
            data: {
                otpCode: otp,
                otpExpiresAt: expiresAt,
            },
        });
        await this.emailService.sendOTP(email, otp, purpose);
    }
    async verifyOTP(email, otp) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user ||
            user.otpCode !== otp ||
            !user.otpExpiresAt ||
            user.otpExpiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.usersService['prisma'].user.update({
            where: { email },
            data: {
                otpCode: null,
                otpExpiresAt: null,
            },
        });
        this.emailService.sendLoginNotification(email).catch(console.error);
        return user;
    }
    async validateOAuthLogin(email, googleId) {
        try {
            let user = await this.usersService.findOneByEmail(email);
            let isNewUser = false;
            if (!user) {
                isNewUser = true;
                const created = await this.usersService.create({
                    email,
                    googleId,
                    role: 'OPERATOR',
                });
                user = created;
                this.emailService.addContactToMarketingList(email).catch(console.error);
            }
            else if (!user.googleId) {
                user = await this.usersService['prisma'].user.update({
                    where: { id: user.id },
                    data: { googleId },
                    include: { workspace: true, personalSettings: true },
                });
            }
            return { ...user, isNewUser };
        }
        catch (error) {
            console.error('Error in validateOAuthLogin:', error);
            throw error;
        }
    }
    async createWorkspaceForUser(userId, data) {
        const user = await this.usersService['prisma'].user.findUnique({
            where: { id: userId },
            include: { workspace: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.workspaceId) {
            throw new common_1.ConflictException('User already belongs to a workspace');
        }
        const existingWorkspace = await this.prisma.workspace.findUnique({
            where: { subdomain: data.subdomain },
        });
        if (existingWorkspace) {
            throw new common_1.ConflictException('Subdomain already taken');
        }
        const workspace = await this.prisma.workspace.create({
            data: {
                name: data.name,
                subdomain: data.subdomain,
                branding: data.branding,
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { workspaceId: workspace.id, role: 'ADMIN' },
        });
        return workspace;
    }
    async joinWorkspace(userId, code) {
        const user = await this.usersService['prisma'].user.findUnique({
            where: { id: userId },
            include: { workspace: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.workspaceId) {
            throw new common_1.ConflictException('User already belongs to a workspace');
        }
        const invitation = await this.prisma.invitation.findFirst({
            where: {
                code: code.toUpperCase(),
                revoked: false,
            },
        });
        if (!invitation ||
            invitation.usedCount >= invitation.maxUses ||
            invitation.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired invitation code');
        }
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: invitation.workspaceId },
        });
        if (!workspace) {
            throw new common_1.BadRequestException('Workspace not found');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { workspaceId: workspace.id, role: invitation.role },
        });
        await this.prisma.invitation.update({
            where: { id: invitation.id },
            data: { usedCount: { increment: 1 } },
        });
        return workspace;
    }
    async login(user) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            workspaceId: user.workspaceId,
        };
        const access_token = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: '15m' });
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, { secret: process.env.JWT_SECRET, expiresIn: '7d' });
        const hashedToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.refreshToken.create({
            data: {
                token: hashedToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return { access_token, refresh_token: refreshToken };
    }
    async refreshTokens(refreshToken) {
        const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_SECRET || 'yq-queue-super-secret-key' });
        if (payload.type !== 'refresh')
            throw new common_1.UnauthorizedException('Invalid token type');
        const stored = await this.prisma.refreshToken.findFirst({
            where: { userId: payload.sub, revoked: false, expiresAt: { gt: new Date() } },
        });
        if (!stored)
            throw new common_1.UnauthorizedException('Refresh token not found or expired');
        const match = await bcrypt.compare(refreshToken, stored.token);
        if (!match)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const newPayload = { email: user.email, sub: user.id, role: user.role, workspaceId: user.workspaceId };
        const access_token = this.jwtService.sign(newPayload, { secret: process.env.JWT_SECRET, expiresIn: '15m' });
        const newRefreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, { secret: process.env.JWT_SECRET, expiresIn: '7d' });
        const hashedNew = await bcrypt.hash(newRefreshToken, 10);
        await this.prisma.refreshToken.create({
            data: { token: hashedNew, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });
        return { access_token, refresh_token: newRefreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map