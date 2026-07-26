import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  private generateCode(): string {
    return randomBytes(6).toString('hex').toUpperCase().substring(0, 8);
  }

  async createInvitation(
    workspaceId: string,
    createdBy: string,
    data: {
      email?: string;
      role?: string;
      maxUses?: number;
      expiresInDays?: number;
    },
  ) {
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

    const invitation = await this.prisma.invitation.create({
      data: {
        workspaceId,
        code,
        email: data.email,
        role: (data.role as Role) || 'OPERATOR',
        maxUses: data.maxUses || 5,
        expiresAt,
        createdBy,
      },
    });

    return invitation;
  }

  async getInvitations(workspaceId: string) {
    return this.prisma.invitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvitationByCode(code: string) {
    return this.prisma.invitation.findFirst({
      where: { code: code.toUpperCase() },
      include: {
        workspace: { select: { id: true, name: true, subdomain: true } },
      },
    });
  }

  async revokeInvitation(id: string, workspaceId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, workspaceId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async validateAndUseInvitation(
    code: string,
  ): Promise<{ workspaceId: string; role: string }> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { code: code.toUpperCase(), revoked: false },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation code');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation code has expired');
    }

    if (invitation.usedCount >= invitation.maxUses) {
      throw new BadRequestException('Invitation code has reached maximum uses');
    }

    return {
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    };
  }
}
