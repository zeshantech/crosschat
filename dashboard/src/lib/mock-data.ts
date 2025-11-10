import dayjs from "dayjs";
import { nanoid } from "nanoid";

import {
  AnalyticsSummary,
  Conversation,
  ConversationTag,
  MessagingPlatform,
  Notification,
  PlatformConnection,
  MessageAttachment,
  TeamMember,
  RoleDefinition,
} from "./types/chat";

const platforms: Record<MessagingPlatform, { name: string; accent: string }> = {
  whatsapp: { name: "WhatsApp", accent: "#25d366" },
  messenger: { name: "Messenger", accent: "#0084ff" },
  instagram: { name: "Instagram", accent: "#f56040" },
  slack: { name: "Slack", accent: "#611f69" },
  telegram: { name: "Telegram", accent: "#0088cc" },
  discord: { name: "Discord", accent: "#5865f2" },
  line: { name: "LINE", accent: "#06c755" },
  wechat: { name: "WeChat", accent: "#7bb32e" },
  twitter: { name: "Twitter", accent: "#1da1f2" },
  linkedin: { name: "LinkedIn", accent: "#0a66c2" },
  skype: { name: "Skype", accent: "#00aff0" },
  viber: { name: "Viber", accent: "#7360f2" },
  signal: { name: "Signal", accent: "#3a76f0" },
  email: { name: "Email", accent: "#6c5ce7" },
  sms: { name: "SMS", accent: "#00c853" },
  unknown: { name: "Unknown", accent: "#9e9e9e" },
};

export const mockTags: ConversationTag[] = [
  { id: "tag_urgent", label: "Urgent", color: "#ff3b30" },
  { id: "tag_vip", label: "VIP", color: "#ffcc00" },
  { id: "tag_followup", label: "Follow-up", color: "#5ac8fa" },
  { id: "tag_demo", label: "Demo Request", color: "#5856d6" },
];

const now = dayjs();

export const mockTeamMembers: TeamMember[] = [
  {
    id: "member_alex",
    name: "Alex Morgan",
    email: "alex@robocall.ai",
    role: "owner",
    status: "online",
    avatarUrl: "/avatars/alex.png",
    lastActiveAt: now.toISOString(),
  },
  {
    id: "member_sophia",
    name: "Sophia Lee",
    email: "sophia@robocall.ai",
    role: "admin",
    status: "online",
    avatarUrl: "/avatars/sophia.png",
    lastActiveAt: now.subtract(5, "minute").toISOString(),
  },
  {
    id: "member_liam",
    name: "Liam Patel",
    email: "liam@robocall.ai",
    role: "agent",
    status: "away",
    avatarUrl: "/avatars/liam.png",
    lastActiveAt: now.subtract(35, "minute").toISOString(),
  },
  {
    id: "member_ai",
    name: "Robocall AI",
    email: "ai@robocall.ai",
    role: "ai",
    status: "online",
    avatarUrl: "/avatars/ai.png",
    lastActiveAt: now.toISOString(),
  },
];

export const mockRoles: RoleDefinition[] = [
  {
    id: "role_owner",
    label: "Owner",
    description: "Full access",
    permissions: [
      "view_inbox",
      "manage_notifications",
      "manage_connections",
      "manage_members",
      "view_analytics",
      "configure_settings",
    ],
  },
  {
    id: "role_agent",
    label: "Agent",
    description: "Standard agent seat",
    permissions: ["view_inbox", "manage_notifications"],
  },
  {
    id: "role_analyst",
    label: "Analyst",
    description: "Read-only analytics",
    permissions: ["view_inbox", "view_analytics"],
  },
];

const makeMessage = ({
  id,
  conversationId,
  senderId,
  content,
  minutesAgo,
  status,
  isInbound,
  attachments,
}: {
  id?: string;
  conversationId: string;
  senderId: string;
  content: string;
  minutesAgo: number;
  status?: "sent" | "delivered" | "read" | "failed" | "queued";
  isInbound: boolean;
  attachments?: MessageAttachment[];
}) => ({
  id: id ?? nanoid(),
  conversationId,
  senderId,
  content,
  createdAt: now.subtract(minutesAgo, "minute").toISOString(),
  status: status ?? "delivered",
  isInbound,
  attachments,
});

export const mockConversations: Conversation[] = [
  {
    id: "conv_whatsapp_01",
    title: "Andrei Popescu",
    participants: [
      {
        id: "contact_andrei",
        displayName: "Andrei Popescu",
        handle: "+40721 123 456",
        platform: "whatsapp",
        avatarUrl: "/avatars/andrei.png",
      },
      {
        id: "member_sophia",
        displayName: "Sophia Lee",
        platform: "whatsapp",
      },
    ],
    platform: "whatsapp",
    lastMessageAt: now.subtract(3, "minute").toISOString(),
    unreadCount: 2,
    tags: [mockTags[0]],
    isFavorite: true,
    messages: [
      makeMessage({
        conversationId: "conv_whatsapp_01",
        senderId: "contact_andrei",
        content: "Hello! We need to update the shipping address for order #1042.",
        minutesAgo: 12,
        isInbound: true,
      }),
      makeMessage({
        conversationId: "conv_whatsapp_01",
        senderId: "member_sophia",
        content: "Absolutely, can you share the correct address?",
        minutesAgo: 8,
        isInbound: false,
        status: "read",
      }),
      makeMessage({
        conversationId: "conv_whatsapp_01",
        senderId: "contact_andrei",
        content: "Strada Aviatorilor 10, București 011863.",
        minutesAgo: 3,
        isInbound: true,
        attachments: [
          {
            id: "attach_invoice_1042",
            type: "document",
            name: "invoice-1042.pdf",
            mimeType: "application/pdf",
            sizeInBytes: 48200,
          },
        ],
      }),
    ],
  },
  {
    id: "conv_slack_02",
    title: "ACME Support Channel",
    participants: [
      {
        id: "contact_acme",
        displayName: "ACME Corp",
        handle: "#support",
        platform: "slack",
      },
      {
        id: "member_liam",
        displayName: "Liam Patel",
        platform: "slack",
      },
    ],
    platform: "slack",
    lastMessageAt: now.subtract(25, "minute").toISOString(),
    unreadCount: 0,
    isArchived: true,
    messages: [
      makeMessage({
        conversationId: "conv_slack_02",
        senderId: "contact_acme",
        content: "Morning team! Are we still on track for the release?",
        minutesAgo: 55,
        isInbound: true,
      }),
      makeMessage({
        conversationId: "conv_slack_02",
        senderId: "member_liam",
        content: "Yes, QA passed overnight. Preparing announcements.",
        minutesAgo: 50,
        isInbound: false,
        status: "read",
      }),
      makeMessage({
        conversationId: "conv_slack_02",
        senderId: "contact_acme",
        content: "Perfect. Could you also share the rollout checklist?",
        minutesAgo: 25,
        isInbound: true,
      }),
    ],
  },
  {
    id: "conv_instagram_03",
    title: "Elena from Breezy Homes",
    participants: [
      {
        id: "contact_elena",
        displayName: "Elena M.",
        handle: "@breezyhomes",
        platform: "instagram",
        avatarUrl: "/avatars/elena.png",
      },
      {
        id: "member_alex",
        displayName: "Alex Morgan",
        platform: "instagram",
      },
    ],
    platform: "instagram",
    lastMessageAt: now.subtract(120, "minute").toISOString(),
    unreadCount: 0,
    isPinned: true,
    isSpam: true,
    tags: [mockTags[1], mockTags[3]],
    messages: [
      makeMessage({
        conversationId: "conv_instagram_03",
        senderId: "contact_elena",
        content:
          "The AI replies look great! Could we add an upbeat tone preset for future campaigns?",
        minutesAgo: 145,
        isInbound: true,
      }),
      makeMessage({
        conversationId: "conv_instagram_03",
        senderId: "member_alex",
        content:
          "Love that idea. I will configure an upbeat preset and loop back in 15 minutes.",
        minutesAgo: 135,
        isInbound: false,
        status: "read",
      }),
      makeMessage({
        conversationId: "conv_instagram_03",
        senderId: "contact_elena",
        content: "Thanks, Alex! Excited to see the update.",
        minutesAgo: 120,
        isInbound: true,
      }),
    ],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "notif_assign_01",
    title: "Conversation assigned to you",
    description: "Sophia assigned Andrei Popescu (WhatsApp) to you.",
    createdAt: now.subtract(2, "minute").toISOString(),
    type: "assignment",
    status: "unread",
    relatedConversationId: "conv_whatsapp_01",
  },
  {
    id: "notif_platform_02",
    title: "Slack workspace reconnected",
    description: "The ACME Support Channel workspace is now live.",
    createdAt: now.subtract(35, "minute").toISOString(),
    type: "platform",
    status: "read",
  },
  {
    id: "notif_message_03",
    title: "New Instagram message",
    description: "Elena from Breezy Homes replied to your message.",
    createdAt: now.subtract(90, "minute").toISOString(),
    type: "message",
    status: "archived",
    relatedConversationId: "conv_instagram_03",
  },
];

export const mockConnections: PlatformConnection[] = Object.entries(platforms).map(
  ([platformId, value]) => ({
    id: `conn_${platformId}`,
    platform: platformId as MessagingPlatform,
    displayName: value.name,
    status:
      platformId === "wechat" || platformId === "line"
        ? "pending"
        : platformId === "unknown"
        ? "disconnected"
        : "connected",
    lastSyncedAt: now.subtract(Math.floor(Math.random() * 120), "minute").toISOString(),
    accountName:
      platformId === "whatsapp"
        ? "Robocall HQ"
        : platformId === "email"
        ? "support@robocall.ai"
        : "robocall",
    errorMessage: platformId === "unknown" ? "Awaiting configuration." : undefined,
  })
);

export const mockAnalyticsSummary: AnalyticsSummary = {
  totalMessages: 4820,
  avgFirstResponseMinutes: 3.2,
  resolutionRate: 0.91,
  topPlatforms: [
    { platform: "whatsapp", total: 1820 },
    { platform: "slack", total: 960 },
    { platform: "instagram", total: 640 },
    { platform: "email", total: 520 },
  ],
  engagementByPlatform: [
    { platform: "whatsapp", engagementScore: 0.88 },
    { platform: "instagram", engagementScore: 0.82 },
    { platform: "slack", engagementScore: 0.61 },
    { platform: "telegram", engagementScore: 0.54 },
  ],
  teamPerformance: [
    {
      memberId: "member_alex",
      messagesHandled: 1420,
      avgResponseMinutes: 2.1,
      csat: 0.95,
    },
    {
      memberId: "member_sophia",
      messagesHandled: 1205,
      avgResponseMinutes: 2.6,
      csat: 0.93,
    },
    {
      memberId: "member_liam",
      messagesHandled: 680,
      avgResponseMinutes: 4.3,
      csat: 0.89,
    },
  ],
};

export { mockRoles };
