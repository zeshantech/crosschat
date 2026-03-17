import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';

type SendMessageDto = {
  senderId: string;
  content: string;
  isInbound?: boolean;
};

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations() {
    return this.chatService.listConversations();
  }

  @Get('conversations/:conversationId/messages')
  getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.listMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages')
  postMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.chatService.sendMessage({
      conversationId,
      content: body.content,
      senderId: body.senderId,
      isInbound: body.isInbound,
    });
  }

  @Sse('stream')
  streamConversation(
    @Query('conversationId') conversationId?: string,
    @Query('decrypt') decrypt?: string,
  ): Observable<MessageEvent> {
    const shouldDecrypt = decrypt === 'true';
    return new Observable<MessageEvent>((subscriber) => {
      const unsubscribe = this.chatService.subscribe((event) => {
        if (conversationId && event.payload.conversationId !== conversationId) {
          return;
        }

        if (event.type === 'message.created' && shouldDecrypt) {
          subscriber.next({
            type: event.type,
            data: {
              ...event.payload,
              content: this.chatService.decryptMessage(event.payload.encryptedContent),
            },
          });
          return;
        }

        subscriber.next({ type: event.type, data: event.payload });
      });

      return () => unsubscribe();
    });
  }
}
