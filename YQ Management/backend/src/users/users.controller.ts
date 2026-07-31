import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../auth/workspace.guard';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
@Roles(Role.TENANT_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Req() req: AuthenticatedRequest) {
    return this.usersService.getUsersByWorkspace(req.user.workspaceId);
  }

  @Post()
  createUser(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.usersService.createUser(
      req.user.tenantId,
      req.user.workspaceId,
      body,
    );
  }

  @Delete(':id')
  async deleteUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.usersService.deleteUser(
      req.user.workspaceId,
      id,
      req.user.userId,
    );
    return result;
  }
}
