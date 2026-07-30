import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
      select: { id: true, email: true, role: true },
    });
  }

  async createUser(
    tenantId: string,
    data: { email: string; role: any; password?: string },
  ) {
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    } else {
      hashedPassword = await bcrypt.hash('Welcome123!', 10);
    }

    return this.prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        role: data.role,
        password: hashedPassword,
      },
      select: { id: true, email: true, role: true },
    });
  }

  async deleteUser(tenantId: string, id: string, currentUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, tenantId: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to this tenant');
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException(
        'You cannot remove yourself from the staff',
      );
    }

    if (targetUser.role === 'TENANT_ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { tenantId, role: 'TENANT_ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last admin. Transfer admin role to another user first.',
        );
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}
