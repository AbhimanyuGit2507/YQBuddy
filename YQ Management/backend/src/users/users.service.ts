import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { workspace: true, personalSettings: true },
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

  async getUsersByWorkspace(workspaceId: string) {
    return this.prisma.user.findMany({
      where: { workspaceId },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async createUser(
    workspaceId: string,
    data: { email: string; role: any; password?: string },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    } else {
      const randomPassword = Array.from(
        { length: 16 },
        () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'[
            Math.floor(Math.random() * 68)
          ],
      ).join('');
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

  async deleteUser(workspaceId: string, id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findFirst({
      where: { id, workspaceId },
      include: {
        workspace: { include: { users: { where: { role: 'ADMIN' } } } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      const adminCount = user.workspace?.users?.length || 0;
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin user');
      }
    }

    return this.prisma.user.delete({
      where: { id, workspaceId },
    });
  }

  async updateUserRole(
    workspaceId: string,
    userId: string,
    newRole: string,
    currentUserId: string,
  ) {
    if (userId === currentUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
      include: {
        workspace: { include: { users: { where: { role: 'ADMIN' } } } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount =
        user.workspace?.users?.filter((u) => u.role === 'ADMIN').length || 0;
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Cannot remove the last admin. Transfer ownership first.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async toggleUserStatus(
    workspaceId: string,
    userId: string,
    currentUserId: string,
  ) {
    if (userId === currentUserId) {
      throw new ForbiddenException('Cannot disable yourself');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async transferOwnership(
    workspaceId: string,
    currentUserId: string,
    newAdminId: string,
  ) {
    if (currentUserId === newAdminId) {
      throw new BadRequestException('Cannot transfer ownership to yourself');
    }

    const newAdmin = await this.prisma.user.findFirst({
      where: { id: newAdminId, workspaceId },
    });

    if (!newAdmin) {
      throw new NotFoundException('User not found in workspace');
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

  async getWorkspaceAdmins(workspaceId: string) {
    return this.prisma.user.findMany({
      where: { workspaceId, role: 'ADMIN' },
      select: { id: true, email: true },
    });
  }
}
