export type MessagingPlatform =
  | "whatsapp"
  | "messenger"
  | "instagram"
  | "slack"
  | "telegram"
  | "discord"
  | "line"
  | "wechat"
  | "twitter"
  | "linkedin"
  | "skype"
  | "viber"
  | "signal"
  | "email"
  | "sms"
  | "unknown";

export type ConversationTag = {
  id: string;
  label: string;
  color?: string;
};

export type Participant = {
  id: string;
  displayName: string;
  handle?: string;
  platform: MessagingPlatform;
  avatarUrl?: string;
  email?: string;
};

export type MessageAttachmentType =
  | "image"
  | "video"
  | "audio"
  | "voice"
  | "document"
  | "contact"
  | "location"
  | "poll"
  | "event"
  | "link"
  | "sticker"
  | "other";

export type MessageAttachment = {
  id: string;
  type: MessageAttachmentType;
  name: string;
  mimeType?: string;
  sizeInBytes?: number;
  previewUrl?: string;
  downloadUrl?: string;
  durationSeconds?: number;
  waveform?: number[];
  contact?: { name: string; phone: string };
  location?: { title: string; subtitle?: string; mapImageUrl?: string };
  poll?: { question: string; options: Array<{ id: string; label: string; votes?: number }>; allowsMultiple?: boolean };
  event?: { title: string; date: string; location?: string };
  link?: { url: string; title?: string; description?: string; imageUrl?: string };
  stickerUrl?: string;
};

export type MessageReaction = {
  emoji: "👍" | "❤️" | "😂" | "😮" | "😢" | "🙏" | string;
  reactedBy: string;
  reactedAt: string;
};

export type MessageStatus = "sent" | "delivered" | "read" | "failed" | "queued";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  isInbound: boolean;
  metadata?: Record<string, unknown>;
  isStarred?: boolean;
  isPinned?: boolean;
  editedAt?: string;
};

export type Conversation = {
  id: string;
  title: string;
  participants: Participant[];
  platform: MessagingPlatform;
  lastMessageAt: string;
  unreadCount: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  isSpam?: boolean;
  assignedTo?: string;
  tags?: ConversationTag[];
  messages: Message[];
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: "message" | "platform" | "system" | "assignment";
  status: "unread" | "read" | "archived";
  relatedConversationId?: string;
};

export type RolePermission =
  | "view_inbox"
  | "manage_notifications"
  | "manage_connections"
  | "manage_members"
  | "view_analytics"
  | "configure_settings";

export type RoleDefinition = {
  id: string;
  label: string;
  description?: string;
  permissions: RolePermission[];
};

export type TeamMemberRole = "owner" | "admin" | "agent" | "viewer" | "ai" | string;

export type TeamMember = {
  id: string;
  name: string;
  role: TeamMemberRole;
  email: string;
  avatarUrl?: string;
  assignedConversationIds?: string[];
  lastActiveAt?: string;
  status?: "online" | "offline" | "away" | "dnd";
};

export type PlatformConnection = {
  id: string;
  platform: MessagingPlatform;
  displayName: string;
  status: "connected" | "disconnected" | "error" | "pending";
  lastSyncedAt?: string;
  accountName?: string;
  errorMessage?: string;
};

export type AnalyticsSummary = {
  totalMessages: number;
  avgFirstResponseMinutes: number;
  resolutionRate: number;
  topPlatforms: Array<{ platform: MessagingPlatform; total: number }>;
  engagementByPlatform: Array<{ platform: MessagingPlatform; engagementScore: number }>;
  teamPerformance: Array<{
    memberId: string;
    messagesHandled: number;
    avgResponseMinutes: number;
    csat: number;
  }>;
};

export type ChatPanel =
  | "settings"
  | "notifications"
  | "tags"
  | "connect"
  | "members"
  | "analytics";
