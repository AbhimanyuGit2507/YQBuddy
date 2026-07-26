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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOneByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { workspace: true, personalSettings: true },
        });
    }
    async create(data) {
        let hashedPassword = null;
        if (data.password) {
            hashedPassword = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
    }
    async getUsersByWorkspace(workspaceId) {
        return this.prisma.user.findMany({
            where: { workspaceId },
            select: { id: true, email: true, role: true, status: true },
        });
    }
    async createUser(workspaceId, data) {
        const existing = await this.prisma.user.findFirst({
            where: { email: data.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already in use');
        }
        let hashedPassword = null;
        if (data.password) {
            hashedPassword = await bcrypt.hash(data.password, 10);
        }
        else {
            const randomPassword = Array.from({ length: 16 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'[Math.floor(Math.random() * 68)]).join('');
            hashedPassword = await bcrypt.hash(randomPassword, 10);
        }
        const user = await this.prisma.user.create({
            data: {
                workspaceId,
                email: data.email,
                role: data.role,
                password: hashedPassword,
            },
            select: { id: true, email: true, role: true, status: true },
        });
        await this.prisma.personalSettings.create({
            data: {
                userId: user.id,
            },
        });
        return user;
    }
    async deleteUser(workspaceId, id, currentUserId) {
        if (id === currentUserId) {
            throw new common_1.ForbiddenException('Cannot delete your own account');
        }
        const user = await this.prisma.user.findFirst({
            where: { id, workspaceId },
            include: { workspace: { include: { users: { where: { role: 'ADMIN' } } } } },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === 'ADMIN') {
            const adminCount = user.workspace?.users?.length || 0;
            if (adminCount <= 1) {
                throw new common_1.ForbiddenException('Cannot delete the last admin user');
            }
        }
        return this.prisma.user.delete({
            where: { id, workspaceId },
        });
    }
    async updateUserRole(workspaceId, userId, newRole, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.ForbiddenException('Cannot change your own role');
        }
        const user = await this.prisma.user.findFirst({
            where: { id: userId, workspaceId },
            include: {
                workspace: { include: { users: { where: { role: 'ADMIN' } } } },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
            const adminCount = user.workspace?.users?.filter((u) => u.role === 'ADMIN').length || 0;
            if (adminCount <= 1) {
                throw new common_1.ForbiddenException('Cannot remove the last admin. Transfer ownership first.');
            }
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: { id: true, email: true, role: true, status: true },
        });
    }
    async toggleUserStatus(workspaceId, userId, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.ForbiddenException('Cannot disable yourself');
        }
        const user = await this.prisma.user.findFirst({
            where: { id: userId, workspaceId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: newStatus },
            select: { id: true, email: true, role: true, status: true },
        });
    }
    async transferOwnership(workspaceId, currentUserId, newAdminId) {
        if (currentUserId === newAdminId) {
            throw new common_1.BadRequestException('Cannot transfer ownership to yourself');
        }
        const newAdmin = await this.prisma.user.findFirst({
            where: { id: newAdminId, workspaceId },
        });
        if (!newAdmin) {
            throw new common_1.NotFoundException('User not found in workspace');
        }
        await this.prisma.user.update({
            where: { id: currentUserId },
            data: { role: 'OPERATOR' },
        });
        return this.prisma.user.update({
            where: { id: newAdminId },
            data: { role: 'ADMIN' },
            select: { id: true, email: true, role: true, status: true },
        });
    }
    async getWorkspaceAdmins(workspaceId) {
        return this.prisma.user.findMany({
            where: { workspaceId, role: 'ADMIN' },
            select: { id: true, email: true },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map