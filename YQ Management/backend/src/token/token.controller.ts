import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Permission } from '../permissions/permissions.enum';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { RequirePermissions } from '../permissions/permissions.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RateLimitGuard } from '../auth/rate-limit.guard';
import { UuidPipe, PhonePipe } from '../common/pipes/validation.pipes';
import {
  RequestOtpDto,
  JoinQueueDto,
  CancelTokenDto,
  CheckInTokenDto,
  ValidateTokenDto,
  TransferTokenDto,
} from './dto/token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @UseGuards(RateLimitGuard)
  @Post('request-otp')
  async requestOtp(@Body() body: RequestOtpDto) {
    return this.tokenService.requestOtp(body.phone);
  }

  // Customer facing - no auth required
  @UseGuards(RateLimitGuard)
  @Post('join')
  async joinQueue(@Body() body: JoinQueueDto) {
    return this.tokenService.joinQueue(
      body.queueId,
      body.customerName,
      body.phone,
      body.otp,
      body.formResponses,
      body.language,
      body.scheduledFor,
    );
  }

  @UseGuards(RateLimitGuard)
  @Get(':id/status')
  async getTokenStatus(@Param('id', UuidPipe) id: string) {
    return this.tokenService.getTokenStatus(id);
  }

  @UseGuards(RateLimitGuard)
  @Post(':id/cancel')
  async cancelToken(@Param('id', UuidPipe) id: string) {
    return this.tokenService.cancelToken(id);
  }

  @UseGuards(RateLimitGuard)
  @Post(':id/checkin')
  async checkInToken(@Param('id', UuidPipe) id: string) {
    return this.tokenService.checkIn(id);
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.QUEUE_OPERATE)
  @Post('advance/:queueId')
  async advanceQueue(
    @Req() req: any,
    @Param('queueId', UuidPipe) queueId: string,
  ) {
    return this.tokenService.advanceQueue(queueId);
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.QUEUE_OPERATE)
  @Post('validate')
  async validateToken(@Req() req: any, @Body() body: ValidateTokenDto) {
    return this.tokenService.validateToken(body.tokenId);
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.QUEUE_OPERATE)
  @Post(':id/transfer')
  async transferToken(
    @Req() req: any,
    @Param('id', UuidPipe) id: string,
    @Body() body: TransferTokenDto,
  ) {
    return this.tokenService.transferToken(id, body.nextQueueId);
  }
}
