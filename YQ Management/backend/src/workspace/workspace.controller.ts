import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async createWorkspace(
    @Body() body: { name: string; subdomain: string; branding?: any },
  ) {
    return this.workspaceService.createWorkspace(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllWorkspaces() {
    return this.workspaceService.getAllWorkspaces();
  }
}
