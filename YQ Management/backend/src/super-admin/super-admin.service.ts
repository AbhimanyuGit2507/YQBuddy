import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalMetrics() {
    const totalTenants = await this.prisma.tenant.count();

    const totalRevenueResult = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETE' },
    });

    const totalCustomersResult = await this.prisma.token.count({
      where: { status: 'COMPLETED' },
    });

    const activeQueues = await this.prisma.queue.count({
      where: { status: 'ACTIVE' },
    });

    const totalUsers = await this.prisma.user.count();

    return {
      totalTenants,
      totalUsers,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      totalCustomersServed: totalCustomersResult,
      activeQueues,
    };
  }

  async getAllTenants(params?: { search?: string }) {
    const where: any = {};
    if (params?.search) {
      where.name = { contains: params.search, mode: 'insensitive' as const };
    }

    return this.prisma.tenant.findMany({
      where,
      include: {
        _count: { select: { users: true, queues: true } },
        workspaces: { select: { id: true, name: true, subscriptionStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, email: true, role: true } },
        workspaces: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionStatus: true,
            ownerId: true,
            _count: { select: { queues: true, transactions: true } },
          },
        },
        transactions: {
          select: { id: true, amount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async deleteTenant(id: string) {
    await this.prisma.tenant.delete({ where: { id } });
    return { success: true };
  }

  async getAllUsers(params?: { search?: string; role?: string }) {
    const where: any = {};
    if (params?.search) {
      where.email = { contains: params.search, mode: 'insensitive' as const };
    }
    if (params?.role && params.role !== 'ALL') {
      where.role = params.role;
    }

    return this.prisma.user.findMany({
      where,
      include: { tenant: { select: { name: true } }, workspace: { select: { name: true } } },
      take: 100,
    });
  }

  async createUser(data: { email: string; role: string; tenantId: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        role: data.role as any,
        tenantId: data.tenantId,
        personalSettings: { theme: 'light', language: 'en', notificationsEnabled: true },
      },
    });
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async getPlatformAnalytics() {
    const totalTenants = await this.prisma.tenant.count();
    const totalUsers = await this.prisma.user.count();
    const totalQueues = await this.prisma.queue.count();
    const totalTokens = await this.prisma.token.count();

    const recentTenants = await this.prisma.tenant.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const subscriptionStats = await this.prisma.subscription.aggregate({
      _count: { status: true },
      where: {},
    });

    const topTenants = await this.prisma.tenant.findMany({
      include: {
        _count: { select: { queues: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      metrics: {
        totalTenants,
        totalUsers,
        totalQueues,
        totalTokens,
        totalSubscriptions: subscriptionStats._count.status,
      },
      trends: recentTenants.map((t) => ({
        date: t.createdAt,
        newTenants: 1,
        totalTenants,
      })),
      topTenants: topTenants.map((t) => ({
        id: t.id,
        name: t.name,
        queueCount: t._count.queues,
        userCount: t._count.users,
      })),
    };
  }

  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        workspace: { select: { name: true, tenant: { select: { name: true } } } },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getRecentTransactions() {
    return this.prisma.transaction.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { name: true } } },
    });
  }
}
