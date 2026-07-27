import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Permission } from '../permissions/permissions.enum';
import { RequirePermissions } from '../permissions/permissions.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { UuidPipe } from '../common/pipes/validation.pipes';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CreateInvitationDto } from './dto/invitation.dto';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('invitations')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard, WorkspaceGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.INVITATION_CREATE, Permission.INVITATION_READ)
  @Get()
  async getInvitations(@Req() req: AuthenticatedRequest) {
    return this.invitationService.getInvitations(req.user.workspaceId);
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.INVITATION_CREATE)
  @Post()
  async createInvitation(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateInvitationDto,
  ) {
    const invitation = await this.invitationService.createInvitation(
      req.user.workspaceId,
      req.user.userId,
      body,
    );
    return { success: true, invitation };
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.INVITATION_CREATE)
  @Post('join-code')
  async createJoinCode(
    @Req() req: AuthenticatedRequest,
    @Body() body: { role?: string },
  ) {
    const role = (body.role as Role) || Role.OPERATOR;
    const invitation = await this.invitationService.createJoinCode(
      req.user.workspaceId,
      req.user.userId,
      role,
    );
    return { success: true, invitation };
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.INVITATION_REVOKE)
  @Delete(':id')
  async revokeInvitation(
    @Req() req: AuthenticatedRequest,
    @Param('id', UuidPipe) id: string,
  ) {
    await this.invitationService.revokeInvitation(id, req.user.workspaceId);
    return { success: true };
  }
}
