import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

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
  }) {
    return this.prisma.workspace.create({
      data,
    });
  }

  async getAllWorkspaces() {
    return this.prisma.workspace.findMany();
  }
}
