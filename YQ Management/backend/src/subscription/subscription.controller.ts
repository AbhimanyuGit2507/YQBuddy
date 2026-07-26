import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { UpgradeSubscriptionDto } from './dto/subscription.dto';
import { DowngradeSubscriptionDto } from './dto/subscription.dto';
import { CancelSubscriptionDto } from './dto/subscription.dto';
import { ResumeSubscriptionDto } from './dto/subscription.dto';
import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('billing/subscriptions')
@UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  async getCurrent(@Req() req: any) {
    return this.subscriptionService.getSubscription(req.user.workspaceId);
  }

  @Post('')
  @Roles(Role.ADMIN)
  async createSubscription(
    @Req() req: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Post('trial')
  @Roles(Role.ADMIN)
  async startTrial(
    @Req() req: any,
    @Body() body: { planId: string; trialDays: number },
  ) {
    return this.subscriptionService.startFreeTrial(
      req.user.workspaceId,
      body.planId,
      body.trialDays,
    );
  }

  @Put('upgrade')
  @Roles(Role.ADMIN)
  async upgradeSubscription(
    @Req() req: any,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.upgradeSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Put('downgrade')
  @Roles(Role.ADMIN)
  async downgradeSubscription(
    @Req() req: any,
    @Body() dto: DowngradeSubscriptionDto,
  ) {
    return this.subscriptionService.downgradeSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Post('cancel')
  @Roles(Role.ADMIN)
  async cancelSubscription(
    @Req() req: any,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancelSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Post('resume')
  @Roles(Role.ADMIN)
  async resumeSubscription(
    @Req() req: any,
    @Body() dto: ResumeSubscriptionDto,
  ) {
    return this.subscriptionService.resumeSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.subscriptionService.getSubscriptionHistory(
      req.user.workspaceId,
      offset ?? 0,
      limit ?? 50,
    );
  }

  @Post('expire-trial')
  @Roles(Role.ADMIN)
  async expireTrial(@Req() req: any) {
    return this.subscriptionService.expireTrial(req.user.workspaceId);
  }

  @Post('renew')
  @Roles(Role.ADMIN)
  async renewSubscription(@Req() req: any) {
    return this.subscriptionService.renewSubscription(req.user.workspaceId);
  }
}