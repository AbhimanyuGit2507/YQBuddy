import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UuidPipe } from '../common/pipes/validation.pipes';
import { SendMessageDto } from './dto/message.dto';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('messages')
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('token/:tokenId')
  async getMessages(@Param('tokenId', UuidPipe) tokenId: string) {
    return this.messagesService.getMessages(tokenId);
  }

  @Post('token/:tokenId')
  async sendMessage(
    @Param('tokenId', UuidPipe) tokenId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.messagesService.sendMessageFromOperator(tokenId, body.text);
  }
}
