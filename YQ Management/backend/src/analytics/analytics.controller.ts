import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get()
  async getDashboardAnalytics(@Req() req: any, @Query('timeframe') timeframe: string) {
    return this.analyticsService.getDashboardAnalytics(req.user.tenantId, timeframe || 'today');
  }
}
