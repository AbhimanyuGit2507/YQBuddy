import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AuthGuard } from '@nestjs/passport';
// Assuming we have a Roles guard, otherwise we manually check in the controller
// For simplicity, we'll manually check req.user.role if a global RolesGuard isn't set up.

@Controller('super-admin')
@UseGuards(AuthGuard('jwt'))
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  private checkSuperAdmin(req: any) {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied. Super Admin only.');
    }
  }

  @Get('metrics')
  async getMetrics(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getGlobalMetrics();
  }

  @Get('workspaces')
  async getWorkspaces(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllWorkspaces();
  }

  @Get('transactions')
  async getTransactions(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getRecentTransactions();
  }
}
