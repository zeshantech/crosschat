import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations() {
    return this.chatService.listConversations();
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageDto,
  ) {
    const message = this.chatService.sendMessage(
      conversationId,
      body.content,
      body.isInbound,
      body.idempotencyKey,
    );

    if (!message) {
      throw new NotFoundException('Conversation not found');
    }

    return message;
  }
}
