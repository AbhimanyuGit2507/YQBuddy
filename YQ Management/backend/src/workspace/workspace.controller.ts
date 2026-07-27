import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '@nestjs/passport';
import { SubdomainPipe } from '../common/pipes/validation.pipes';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async createWorkspace(
    @Body('name') name: string,
    @Body('subdomain', SubdomainPipe) subdomain: string,
    @Body('branding') branding?: any,
  ) {
    return this.workspaceService.createWorkspace({ name, subdomain, branding });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllWorkspaces() {
    return this.workspaceService.getAllWorkspaces();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('join')
  async joinWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body() body: { code: string },
  ) {
    return this.workspaceService.joinWorkspace(req.user.userId, body.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('join-info')
  async getJoinInfo(@Req() req: AuthenticatedRequest) {
    return this.workspaceService.getJoinInfo(req.user.userId);
  }
}
