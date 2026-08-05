import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { AuthGuard } from '@nestjs/passport';
import { SubdomainPipe } from '../common/pipes/validation.pipes';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body('name') name: string,
    @Body('subdomain', SubdomainPipe) subdomain: string,
    @Body('branding') branding?: any,
  ) {
    const tenantId = req.user.tenantId;
    const ownerId = req.user.userId;
    return this.workspaceService.createWorkspace({
      name,
      subdomain,
      branding,
      ownerId,
      tenantId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllWorkspaces(@Req() req: AuthenticatedRequest) {
    if (req.user.role === 'SUPER_ADMIN') {
      return this.workspaceService.getAllWorkspaces();
    }
    throw new ForbiddenException('Forbidden');
  }

  @Get('invite-preview/:code')
  async getInvitePreview(@Param('code') code: string) {
    return this.workspaceService.getInvitePreview(code);
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
