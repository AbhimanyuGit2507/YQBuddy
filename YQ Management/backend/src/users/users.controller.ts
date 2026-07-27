import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Patch,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Permission } from '../permissions/permissions.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../permissions/permissions.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { UuidPipe } from '../common/pipes/validation.pipes';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard, WorkspaceGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_READ)
  @Get()
  getUsers(@Request() req: AuthenticatedRequest) {
    return this.usersService.getUsersByWorkspace(req.user.workspaceId);
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_INVITE)
  @Post()
  createUser(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateUserDto,
  ) {
    return this.usersService.createUser(req.user.workspaceId, body);
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_DELETE)
  @Delete(':id')
  deleteUser(
    @Request() req: AuthenticatedRequest,
    @Param('id', UuidPipe) id: string,
  ) {
    return this.usersService.deleteUser(
      req.user.workspaceId,
      id,
      req.user.userId,
    );
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_UPDATE_ROLE)
  @Patch(':id/role')
  updateUserRole(
    @Request() req: AuthenticatedRequest,
    @Param('id', UuidPipe) id: string,
    @Body() body: { role: string },
  ) {
    return this.usersService.updateUserRole(
      req.user.workspaceId,
      id,
      body.role,
      req.user.userId,
    );
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_DISABLE)
  @Patch(':id/status')
  toggleUserStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id', UuidPipe) id: string,
  ) {
    return this.usersService.toggleUserStatus(
      req.user.workspaceId,
      id,
      req.user.userId,
    );
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.WORKSPACE_TRANSFER)
  @Post('transfer-ownership')
  transferOwnership(
    @Request() req: AuthenticatedRequest,
    @Body() body: { newAdminId: string },
  ) {
    return this.usersService.transferOwnership(
      req.user.workspaceId,
      req.user.userId,
      body.newAdminId,
    );
  }
}
