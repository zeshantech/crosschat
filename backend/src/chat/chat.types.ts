export type MessagingPlatform =
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'telegram'
  | 'email'
  | 'sms';

export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: DeliveryStatus;
  isInbound: boolean;
};

export type ChatConversation = {
  id: string;
  title: string;
  platform: MessagingPlatform;
  unreadCount: number;
  lastMessageAt: string;
  messages: ChatMessage[];
};
