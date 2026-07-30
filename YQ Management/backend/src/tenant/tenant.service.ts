import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantBySubdomain(subdomain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with subdomain ${subdomain} not found`,
      );
    }

    return tenant;
  }

  async createTenant(data: {
    name: string;
    subdomain: string;
    branding?: any;
  }) {
    return this.prisma.tenant.create({
      data,
    });
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany();
  }
}
