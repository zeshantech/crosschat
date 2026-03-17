export type ChatMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: ChatMessageStatus;
  isInbound: boolean;
  encryptedContent: string;
};

export type ChatParticipant = {
  id: string;
  displayName: string;
  platform: 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'email' | 'unknown';
};

export type ChatConversation = {
  id: string;
  title: string;
  platform: ChatParticipant['platform'];
  participants: ChatParticipant[];
  unreadCount: number;
  lastMessageAt: string;
  messages: ChatMessage[];
};

export type ChatEvent =
  | { type: 'message.created'; payload: ChatMessage }
  | { type: 'message.status.updated'; payload: Pick<ChatMessage, 'id' | 'status' | 'conversationId'> };
