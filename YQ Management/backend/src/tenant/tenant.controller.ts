import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async createTenant(@Body() body: { name: string; subdomain: string; branding?: any }) {
    return this.tenantService.createTenant(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }
}

