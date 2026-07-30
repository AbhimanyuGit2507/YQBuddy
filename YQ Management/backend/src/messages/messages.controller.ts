import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('messages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.TENANT_ADMIN, Role.OPERATOR)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('token/:tokenId')
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('tokenId') tokenId: string,
  ) {
    return this.messagesService.getMessages(tokenId, req.user.tenantId);
  }

  @Post('token/:tokenId')
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('tokenId') tokenId: string,
    @Body() body: { text: string },
  ) {
    return this.messagesService.sendMessageFromOperator(
      tokenId,
      body.text,
      req.user.tenantId,
    );
  }
}
