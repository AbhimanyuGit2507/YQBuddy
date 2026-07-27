import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('token/:tokenId')
  async getMessages(@Param('tokenId') tokenId: string) {
    return this.messagesService.getMessages(tokenId);
  }

  @Post('token/:tokenId')
  async sendMessage(
    @Param('tokenId') tokenId: string,
    @Body() body: { text: string }
  ) {
    return this.messagesService.sendMessageFromOperator(tokenId, body.text);
  }
}
