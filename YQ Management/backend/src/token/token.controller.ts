import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('request-otp')
  async requestOtp(@Body() body: { phone: string }) {
    return this.tokenService.requestOtp(body.phone);
  }

  // Customer facing - no auth required (or could use tenant-based rate limiting)
  @Post('join')
  async joinQueue(@Body() body: { queueId: string; customerName: string; phone?: string; otp?: string; formResponses?: any; language?: string; scheduledFor?: string }) {
    return this.tokenService.joinQueue(body.queueId, body.customerName, body.phone, body.otp, body.formResponses, body.language, body.scheduledFor);
  }

  @Get(':id/status')
  async getTokenStatus(@Param('id') id: string) {
    return this.tokenService.getTokenStatus(id);
  }

  @Post(':id/cancel')
  async cancelToken(@Param('id') id: string) {
    return this.tokenService.cancelToken(id);
  }

  @Post(':id/checkin')
  async checkInToken(@Param('id') id: string) {
    return this.tokenService.checkIn(id);
  }

  // Admin facing - requires JWT
  @UseGuards(AuthGuard('jwt'))
  @Post('advance/:queueId')
  async advanceQueue(@Param('queueId') queueId: string) {
    return this.tokenService.advanceQueue(queueId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('validate')
  async validateToken(@Body() body: { tokenId: string }) {
    return this.tokenService.validateToken(body.tokenId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/transfer')
  async transferToken(@Param('id') id: string, @Body() body: { nextQueueId: string }) {
    return this.tokenService.transferToken(id, body.nextQueueId);
  }
}

