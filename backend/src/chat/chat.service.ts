import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { randomUUID } from 'crypto';
import { ChatConversation, ChatMessage, DeliveryStatus, MessagingPlatform } from './chat.types';

const KEY_SEED = process.env.CHAT_ENCRYPTION_SECRET ?? 'crosschat-dev-secret';
const KEY = createHash('sha256').update(KEY_SEED).digest();

type StoredMessage = Omit<ChatMessage, 'content'> & { encryptedContent: string };
type StoredConversation = Omit<ChatConversation, 'messages'> & { messages: StoredMessage[] };

@Injectable()
export class ChatService {
  private readonly conversations = new Map<string, StoredConversation>();
  private readonly idempotencyMap = new Map<string, string>();

  constructor() {
    this.seed();
  }

  listConversations(): ChatConversation[] {
    return [...this.conversations.values()]
      .map((conversation) => this.toConversation(conversation))
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
  }

  sendMessage(conversationId: string, content: string, isInbound = false, idempotencyKey?: string) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    if (idempotencyKey) {
      const existing = this.idempotencyMap.get(idempotencyKey);
      if (existing) {
        return this.findMessage(conversationId, existing);
      }
    }

    const createdAt = new Date().toISOString();
    const messageId = randomUUID();
    const message: StoredMessage = {
      id: messageId,
      conversationId,
      senderId: isInbound ? 'contact' : 'agent',
      encryptedContent: this.encrypt(content),
      createdAt,
      status: isInbound ? 'delivered' : 'queued',
      isInbound,
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = createdAt;
    conversation.unreadCount = isInbound ? conversation.unreadCount + 1 : 0;

    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, messageId);
    }

    if (!isInbound) {
      this.progressDelivery(conversationId, messageId);
    }

    return this.toMessage(message);
  }

  private progressDelivery(conversationId: string, messageId: string) {
    const statuses: DeliveryStatus[] = ['sent', 'delivered'];
    statuses.forEach((status, index) => {
      setTimeout(() => {
        const message = this.findStoredMessage(conversationId, messageId);
        if (!message) return;
        message.status = status;
      }, (index + 1) * 800);
    });
  }

  private findStoredMessage(conversationId: string, messageId: string) {
    const conversation = this.conversations.get(conversationId);
    return conversation?.messages.find((message) => message.id === messageId);
  }

  private findMessage(conversationId: string, messageId: string) {
    const message = this.findStoredMessage(conversationId, messageId);
    return message ? this.toMessage(message) : null;
  }

  private toConversation(conversation: StoredConversation): ChatConversation {
    return {
      ...conversation,
      messages: conversation.messages.map((message) => this.toMessage(message)),
    };
  }

  private toMessage(message: StoredMessage): ChatMessage {
    return {
      ...message,
      content: this.decrypt(message.encryptedContent),
    };
  }

  private encrypt(content: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', KEY, iv);
    const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  private decrypt(payload: string): string {
    const buffer = Buffer.from(payload, 'base64');
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private seed() {
    this.createConversation('Order #1042', 'whatsapp', [
      this.makeSeedMessage('contact', 'Need to update shipping address', true, 11),
      this.makeSeedMessage('agent', 'Sure, sharing it with logistics now.', false, 7),
    ]);
    this.createConversation('VIP Lead - Acme Corp', 'instagram', [
      this.makeSeedMessage('contact', 'Can we book a demo this week?', true, 17),
    ]);
  }

  private createConversation(title: string, platform: MessagingPlatform, messages: StoredMessage[]) {
    const id = randomUUID();
    const normalizedMessages = messages.map((message) => ({ ...message, conversationId: id }));
    const lastMessageAt = normalizedMessages.at(-1)?.createdAt ?? new Date().toISOString();
    this.conversations.set(id, {
      id,
      title,
      platform,
      unreadCount: normalizedMessages.filter((message) => message.isInbound).length,
      lastMessageAt,
      messages: normalizedMessages,
    });
  }

  private makeSeedMessage(sender: 'agent' | 'contact', content: string, isInbound: boolean, minutesAgo: number): StoredMessage {
    return {
      id: randomUUID(),
      conversationId: '',
      senderId: sender,
      encryptedContent: this.encrypt(content),
      createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
      status: 'delivered',
      isInbound,
    };
  }
}
