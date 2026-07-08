import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  // Customer facing - no auth required (or could use tenant-based rate limiting)
  @Post('join')
  async joinQueue(@Body() body: { queueId: string; customerName: string; phone: string }) {
    return this.tokenService.joinQueue(body.queueId, body.customerName, body.phone);
  }

  @Get(':id/status')
  async getTokenStatus(@Param('id') id: string) {
    return this.tokenService.getTokenStatus(id);
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
}

