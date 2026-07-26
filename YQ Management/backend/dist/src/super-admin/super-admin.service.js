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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SuperAdminService = class SuperAdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getGlobalMetrics() {
        const totalWorkspaces = await this.prisma.workspace.count();
        const totalRevenueResult = await this.prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { status: client_1.TransactionStatus.SUCCESS },
        });
        const totalCustomersResult = await this.prisma.token.count({
            where: { status: 'COMPLETED' },
        });
        const activeQueues = await this.prisma.queue.count({
            where: { status: 'ACTIVE' },
        });
        return {
            totalWorkspaces,
            totalRevenue: totalRevenueResult._sum?.amount || 0,
            totalCustomersServed: totalCustomersResult,
            activeQueues,
        };
    }
    async getAllWorkspaces() {
        return this.prisma.workspace.findMany({
            include: {
                _count: {
                    select: { users: true, queues: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRecentTransactions() {
        return this.prisma.transaction.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { workspace: { select: { name: true } } },
        });
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map