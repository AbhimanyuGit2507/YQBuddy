import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationService } from '../invitation/invitation.service';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationService: InvitationService,
  ) {}

  async getWorkspaceBySubdomain(subdomain: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { subdomain },
    });

    if (!workspace) {
      throw new NotFoundException(
        `Workspace with subdomain ${subdomain} not found`,
      );
    }

    return workspace;
  }

  async createWorkspace(data: {
    name: string;
    subdomain: string;
    branding?: any;
    ownerId: string;
    tenantId: string;
  }) {
    return this.prisma.workspace.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        branding: data.branding,
        ownerId: data.ownerId,
        tenantId: data.tenantId,
      },
    });
  }

  async getAllWorkspaces() {
    return this.prisma.workspace.findMany();
  }

  async joinWorkspace(userId: string, code: string) {
    const invitation =
      await this.invitationService.validateAndUseInvitation(code);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        workspaceId: invitation.workspaceId,
        role: invitation.role as Role,
      },
      include: { workspace: true },
    });

    return {
      success: true,
      workspace: user.workspace,
      role: user.role,
    };
  }

  async getJoinInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      hasWorkspace: !!user.workspaceId,
      workspace: user.workspace,
      role: user.role,
      isOwnWorkspace: user.workspace?.ownerId === user.id,
    };
  }

  async getUserWorkspace(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.workspaceId) {
      throw new BadRequestException('User has no workspace assigned');
    }

    if (!user.workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      workspace: user.workspace,
      role: user.role,
      isOwner: user.workspace.ownerId === user.id,
    };
  }
}
