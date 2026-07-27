import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserUncheckedCreateInput) {
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

  async getUsersByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, role: true }
    });
  }

  async createUser(tenantId: string, data: { email: string, role: any, password?: string }) {
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    } else {
      // Default password or generate random
      hashedPassword = await bcrypt.hash('Welcome123!', 10);
    }
    
    return this.prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        role: data.role,
        password: hashedPassword
      },
      select: { id: true, email: true, role: true }
    });
  }

  async deleteUser(tenantId: string, id: string) {
    return this.prisma.user.delete({
      where: { id, tenantId } // Ensure it belongs to the tenant
    });
  }
}
