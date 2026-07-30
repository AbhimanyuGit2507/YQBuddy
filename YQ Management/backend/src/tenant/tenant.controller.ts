import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../auth/workspace.guard';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('tenant')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Roles(Role.SUPER_ADMIN)
  @Post()
  async createTenant(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string; subdomain: string; branding?: any },
  ) {
    return this.tenantService.createTenant(body);
  }

  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @Get()
  @UseGuards(WorkspaceGuard)
  async getAllTenants(@Req() req: AuthenticatedRequest) {
    return this.tenantService.getAllTenants();
  }
}
