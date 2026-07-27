import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('super-admin')
@UseGuards(AuthGuard('jwt'))
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly configService: ConfigService,
  ) {}

  private checkSuperAdmin(req: any) {
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    if (req.user?.email !== superAdminEmail) {
      throw new UnauthorizedException('Access denied. Super Admin only.');
    }
  }

  @Get('metrics')
  async getMetrics(@Req() req: AuthenticatedRequest) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getGlobalMetrics();
  }

  @Get('workspaces')
  async getWorkspaces(@Req() req: AuthenticatedRequest) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllWorkspaces();
  }

  @Get('tenants')
  async getTenants(@Req() req: AuthenticatedRequest) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllWorkspaces();
  }

  @Get('transactions')
  async getTransactions(@Req() req: AuthenticatedRequest) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getRecentTransactions();
  }
}
