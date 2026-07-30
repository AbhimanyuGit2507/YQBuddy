import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
  Req,
  Query,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AuthGuard } from '@nestjs/passport';

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

  @Get('tenants')
  async getTenants(@Req() req: any, @Query('search') search?: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllTenants({ search });
  }

  @Get('tenants/:id')
  async getTenantById(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getTenantById(id);
  }

  @Delete('tenants/:id')
  async deleteTenant(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.deleteTenant(id);
  }

  @Get('users')
  async getUsers(@Req() req: any, @Query('search') search?: string, @Query('role') role?: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getAllUsers({ search, role });
  }

  @Post('users')
  async createUser(@Req() req: any, @Body() body: { email: string; role: string; tenantId: string }) {
    this.checkSuperAdmin(req);
    return this.superAdminService.createUser(body);
  }

  @Patch('users/:id')
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.updateUser(id, body);
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.superAdminService.deleteUser(id);
  }

  @Get('subscriptions')
  async getSubscriptions(@Req() req: any) {
    this.checkSuperAdmin(req);
    const subs = await this.superAdminService.getAllSubscriptions();
    return { subscriptions: subs };
  }

  @Get('analytics')
  async getAnalytics(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getPlatformAnalytics();
  }

  @Get('transactions')
  async getTransactions(@Req() req: any) {
    this.checkSuperAdmin(req);
    return this.superAdminService.getRecentTransactions();
  }
}