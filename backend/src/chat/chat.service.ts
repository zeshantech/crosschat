import { Injectable } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { ChatConversation, ChatEvent, ChatMessage, ChatMessageStatus } from './chat.types';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

@Injectable()
export class ChatService {
  private readonly key = createHash('sha256')
    .update(process.env.CHAT_ENCRYPTION_KEY ?? 'dev-chat-encryption-key')
    .digest();

  private readonly conversations: ChatConversation[] = [
    {
      id: 'conv_whatsapp_001',
      title: 'Acme Corp Procurement',
      platform: 'whatsapp',
      unreadCount: 0,
      lastMessageAt: new Date().toISOString(),
      participants: [
        { id: 'cust_1', displayName: 'Sara - Acme', platform: 'whatsapp' },
        { id: 'agent_1', displayName: 'Support Agent', platform: 'whatsapp' },
      ],
      messages: [],
    },
  ];

  private readonly listeners = new Set<(event: ChatEvent) => void>();

  listConversations() {
    return this.conversations;
  }

  listMessages(conversationId: string) {
    return this.findConversation(conversationId).messages;
  }

  sendMessage(input: {
    conversationId: string;
    senderId: string;
    content: string;
    isInbound?: boolean;
  }) {
    const conversation = this.findConversation(input.conversationId);
    const createdAt = new Date().toISOString();

    const message: ChatMessage = {
      id: randomUUID(),
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
      encryptedContent: this.encrypt(input.content),
      createdAt,
      status: 'sent',
      isInbound: Boolean(input.isInbound),
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = createdAt;
    if (message.isInbound) {
      conversation.unreadCount += 1;
    }

    this.emit({ type: 'message.created', payload: message });
    this.scheduleDeliveryUpdates(message);

    return message;
  }

  subscribe(listener: (event: ChatEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  decryptMessage(encryptedContent: string) {
    const [ivB64, cipherB64, authTagB64] = encryptedContent.split('.');
    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = Buffer.from(cipherB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  private emit(event: ChatEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private scheduleDeliveryUpdates(message: ChatMessage) {
    this.updateStatus(message, 'delivered', 700);
    this.updateStatus(message, 'read', 1800);
  }

  private updateStatus(message: ChatMessage, status: ChatMessageStatus, delayMs: number) {
    setTimeout(() => {
      const conversation = this.findConversation(message.conversationId);
      const target = conversation.messages.find((item) => item.id === message.id);
      if (!target) {
        return;
      }

      target.status = status;
      this.emit({
        type: 'message.status.updated',
        payload: { id: target.id, status: target.status, conversationId: target.conversationId },
      });
    }, delayMs).unref();
  }

  private findConversation(conversationId: string) {
    const conversation = this.conversations.find((item) => item.id === conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return conversation;
  }

  private encrypt(plainText: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}.${encrypted.toString('base64')}.${authTag.toString('base64')}`;
  }
}
