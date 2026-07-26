import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalMetrics() {
    const totalWorkspaces = await this.prisma.workspace.count();

    const totalRevenueResult = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: TransactionStatus.SUCCESS },
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
}
