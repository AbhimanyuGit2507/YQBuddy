import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalMetrics() {
    const totalTenants = await this.prisma.tenant.count();
    
    const totalRevenueResult = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETE' }
    });
    
    const totalCustomersResult = await this.prisma.token.count({
      where: { status: 'COMPLETED' }
    });

    const activeQueues = await this.prisma.queue.count({
      where: { status: 'ACTIVE' }
    });

    return {
      totalTenants,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      totalCustomersServed: totalCustomersResult,
      activeQueues
    };
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, queues: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRecentTransactions() {
    return this.prisma.transaction.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { name: true } } }
    });
  }
}
