import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { nanoid } from "nanoid";

import {
  mockAnalyticsSummary,
  mockConnections,
  mockConversations,
  mockNotifications,
  mockTags,
  mockRoles,
  mockTeamMembers,
} from "@/lib/mock-data";
import { getPlatformMeta } from "@/lib/platforms";
import { fetchConversations, postMessage } from "@/lib/chat-api";
import {
  AnalyticsSummary,
  Conversation,
  ConversationTag,
  MessagingPlatform,
  Message,
  MessageAttachment,
  Notification,
  PlatformConnection,
  RoleDefinition,
  RolePermission,
  TeamMember,
} from "@/lib/types/chat";

export type DashboardTab =
  | "inbox"
  | "notifications"
  | "tags"
  | "connect"
  | "members"
  | "analytics"
  | "settings"
  | "profile"
  | "roles";

type TabState = {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
};

type InboxState = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectConversation: (conversationId: string | null) => void;
  markConversationRead: (conversationId: string) => void;
  markConversationUnread: (conversationId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  toggleLockConversation: (conversationId: string) => void;
  assignConversation: (conversationId: string, assigneeId: string | null) => void;
  addTagToConversation: (conversationId: string, tagId: string) => void;
  removeTagFromConversation: (conversationId: string, tagId: string) => void;
  toggleArchiveConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  toggleFavoriteConversation: (conversationId: string) => void;
  toggleSpamConversation: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    payload: { content: string; attachments?: MessageAttachment[]; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  loadConversations: () => Promise<void>;
  appendInboundMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message["status"]) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  toggleStarMessage: (conversationId: string, messageId: string) => void;
  togglePinMessage: (conversationId: string, messageId: string) => void;
  editMessage: (conversationId: string, messageId: string, content: string) => void;
  toggleReaction: (
    conversationId: string,
    messageId: string,
    emoji: string,
    reactedBy: string
  ) => void;
};

type NotificationState = {
  notifications: Notification[];
  updateNotificationStatus: (
    notificationId: string,
    status: Notification["status"]
  ) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
};

type TagState = {
  tags: ConversationTag[];
  createTag: (tag: ConversationTag) => void;
  deleteTag: (tagId: string) => void;
  renameTag: (tagId: string, label: string) => void;
};

type ConnectionState = {
  connections: PlatformConnection[];
  updateConnectionStatus: (
    connectionId: string,
    status: PlatformConnection["status"],
    errorMessage?: string
  ) => void;
  addConnection: (platform: MessagingPlatform) => void;
  removeConnection: (connectionId: string) => void;
};

type TeamState = {
  teamMembers: TeamMember[];
  inviteMember: (member: TeamMember) => void;
  updateMemberRole: (memberId: string, role: TeamMember["role"]) => void;
  removeMember: (memberId: string) => void;
};

type RoleState = {
  roles: RoleDefinition[];
  createRole: (role: RoleDefinition) => void;
  deleteRole: (roleId: string) => void;
  renameRole: (roleId: string, label: string) => void;
  updateRolePermissions: (roleId: string, permissions: RolePermission[]) => void;
};

type AnalyticsState = {
  analyticsSummary: AnalyticsSummary;
  setAnalyticsSummary: (summary: AnalyticsSummary) => void;
};

type ChatStore = TabState &
  InboxState &
  NotificationState &
  TagState &
  ConnectionState &
  TeamState &
  RoleState &
  AnalyticsState;

export const useChatStore = create<ChatStore>()(
  devtools((set) => ({
    activeTab: "inbox",
    setActiveTab: (tab) => set({ activeTab: tab }),

    conversations: mockConversations,
    selectedConversationId: null,
    searchTerm: "",
    setSearchTerm: (term) => set({ searchTerm: term }),
    selectConversation: (conversationId) =>
      set({ selectedConversationId: conversationId }),
    markConversationRead: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        ),
      })),
    markConversationUnread: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: Math.max(conversation.unreadCount, 1) }
            : conversation
        ),
      })),
    togglePinConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isPinned: !conversation.isPinned }
            : conversation
        ),
      })),
    toggleMuteConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isMuted: !conversation.isMuted }
            : conversation
        ),
      })),
    toggleLockConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isLocked: !conversation.isLocked }
            : conversation
        ),
      })),
    assignConversation: (conversationId, assigneeId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, assignedTo: assigneeId ?? undefined }
            : conversation
        ),
      })),
    addTagToConversation: (conversationId, tagId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const tag = state.tags.find((item) => item.id === tagId);
          if (!tag) return conversation;
          const tags = conversation.tags ?? [];
          const tagExists = tags.some((item) => item.id === tag.id);
          return {
            ...conversation,
            tags: tagExists ? tags : [...tags, tag],
          };
        }),
      })),
    removeTagFromConversation: (conversationId, tagId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                tags: (conversation.tags ?? []).filter((tag) => tag.id !== tagId),
              }
            : conversation
        ),
      })),
    toggleArchiveConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isArchived: !conversation.isArchived }
            : conversation
        ),
      })),
    deleteConversation: (conversationId) =>
      set((state) => {
        const remaining = state.conversations.filter(
          (conversation) => conversation.id !== conversationId
        );
        const selectedConversationId =
          state.selectedConversationId === conversationId ? null : state.selectedConversationId;
        return {
          conversations: remaining,
          selectedConversationId,
        };
      }),
    toggleFavoriteConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isFavorite: !conversation.isFavorite }
            : conversation
        ),
      })),
    toggleSpamConversation: (conversationId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, isSpam: !conversation.isSpam }
            : conversation
        ),
      })),
    sendMessage: async (conversationId, payload) => {
      const senderId = useChatStore.getState().teamMembers[0]?.id ?? "member_local";
      const optimisticMessage: Message = {
        id: nanoid(),
        conversationId,
        senderId,
        content: payload.content,
        createdAt: new Date().toISOString(),
        status: "queued",
        attachments: payload.attachments ?? [],
        metadata: payload.metadata,
        isInbound: false,
      };

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, optimisticMessage],
                lastMessageAt: optimisticMessage.createdAt,
              }
            : conversation
        ),
      }));

      try {
        const created = await postMessage({ conversationId, senderId, content: payload.content });
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (conversation.id !== conversationId) return conversation;
            return {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === optimisticMessage.id
                  ? {
                      ...message,
                      id: created.id,
                      status: created.status,
                      createdAt: created.createdAt,
                    }
                  : message
              ),
              lastMessageAt: created.createdAt,
            };
          }),
        }));
      } catch {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (conversation.id !== conversationId) return conversation;
            return {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === optimisticMessage.id ? { ...message, status: "failed" } : message
              ),
            };
          }),
        }));
      }
    },
    loadConversations: async () => {
      try {
        const conversations = await fetchConversations();
        set(() => ({ conversations }));
      } catch {
        // fall back to seeded mock data
      }
    },
    appendInboundMessage: (conversationId, message) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unreadCount: conversation.unreadCount + 1,
                lastMessageAt: message.createdAt,
                messages: [...conversation.messages, message],
              }
            : conversation
        ),
      })),
    updateMessageStatus: (conversationId, messageId, status) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === messageId ? { ...message, status } : message
                ),
              }
            : conversation
        ),
      })),
    deleteMessage: (conversationId, messageId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const remainingMessages = conversation.messages.filter(
            (message) => message.id !== messageId
          );
          return {
            ...conversation,
            messages: remainingMessages,
            lastMessageAt: remainingMessages.at(-1)?.createdAt ?? conversation.lastMessageAt,
          };
        }),
      })),
    toggleStarMessage: (conversationId, messageId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          return {
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId
                ? { ...message, isStarred: !message.isStarred }
                : message
            ),
          };
        }),
      })),
    togglePinMessage: (conversationId, messageId) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          return {
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId
                ? { ...message, isPinned: !message.isPinned }
                : message
            ),
          };
        }),
      })),
    editMessage: (conversationId, messageId, content) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const updatedAt = new Date().toISOString();
          return {
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId
                ? { ...message, content, updatedAt, editedAt: updatedAt }
                : message
            ),
          };
        }),
      })),
    toggleReaction: (conversationId, messageId, emoji, reactedBy) =>
      set((state) => ({
        conversations: state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          return {
            ...conversation,
            messages: conversation.messages.map((message) => {
              if (message.id !== messageId) return message;
              const reactions = message.reactions ?? [];
              const existing = reactions.find(
                (reaction) => reaction.emoji === emoji && reaction.reactedBy === reactedBy
              );
              const updatedReactions = existing
                ? reactions.filter(
                    (reaction) =>
                      !(
                        reaction.emoji === existing.emoji &&
                        reaction.reactedBy === existing.reactedBy
                      )
                  )
                : [
                    ...reactions,
                    {
                      emoji,
                      reactedBy,
                      reactedAt: new Date().toISOString(),
                    },
                  ];
              return { ...message, reactions: updatedReactions };
            }),
          };
        }),
      })),

    notifications: mockNotifications,
    updateNotificationStatus: (notificationId, status) =>
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status }
            : notification
        ),
      })),
    markAllNotificationsAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.status === "unread"
            ? { ...notification, status: "read" }
            : notification
        ),
      })),
    deleteNotification: (notificationId) =>
      set((state) => ({
        notifications: state.notifications.filter(
          (notification) => notification.id !== notificationId
        ),
      })),

    tags: mockTags,
    createTag: (tag) =>
      set((state) => ({
        tags: [...state.tags, tag],
      })),
    deleteTag: (tagId) =>
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== tagId),
        conversations: state.conversations.map((conversation) => ({
          ...conversation,
          tags: (conversation.tags ?? []).filter((tag) => tag.id !== tagId),
        })),
      })),
    renameTag: (tagId, label) =>
      set((state) => ({
        tags: state.tags.map((tag) =>
          tag.id === tagId ? { ...tag, label } : tag
        ),
        conversations: state.conversations.map((conversation) => ({
          ...conversation,
          tags: (conversation.tags ?? []).map((tag) =>
            tag.id === tagId ? { ...tag, label } : tag
          ),
        })),
      })),

    connections: mockConnections,
    updateConnectionStatus: (connectionId, status, errorMessage) =>
      set((state) => ({
        connections: state.connections.map((connection) =>
          connection.id === connectionId
            ? { ...connection, status, errorMessage }
            : connection
        ),
      })),
    addConnection: (platform) =>
      set((state) => {
        const meta = getPlatformMeta(platform);
        const newConnection: PlatformConnection = {
          id: `conn_${platform}_${nanoid(6)}`,
          platform,
          displayName: meta.name,
          status: "connected",
          accountName: `${meta.name} account`,
          lastSyncedAt: new Date().toISOString(),
        };
        return { connections: [...state.connections, newConnection] };
      }),
    removeConnection: (connectionId) =>
      set((state) => ({
        connections: state.connections.filter((connection) => connection.id !== connectionId),
      })),

    teamMembers: mockTeamMembers,
    inviteMember: (member) =>
      set((state) => ({
        teamMembers: [...state.teamMembers, member],
      })),
    updateMemberRole: (memberId, role) =>
      set((state) => ({
        teamMembers: state.teamMembers.map((member) =>
          member.id === memberId ? { ...member, role } : member
        ),
      })),
    removeMember: (memberId) =>
      set((state) => ({
        teamMembers: state.teamMembers.filter((member) => member.id !== memberId),
      })),

    roles: mockRoles,
    createRole: (role) =>
      set((state) => ({
        roles: [...state.roles, role],
      })),
    deleteRole: (roleId) =>
      set((state) => ({
        roles: state.roles.filter((role) => role.id !== roleId),
      })),
    renameRole: (roleId, label) =>
      set((state) => ({
        roles: state.roles.map((role) => (role.id === roleId ? { ...role, label } : role)),
      })),
    updateRolePermissions: (roleId, permissions) =>
      set((state) => ({
        roles: state.roles.map((role) =>
          role.id === roleId ? { ...role, permissions } : role
        ),
      })),

    analyticsSummary: mockAnalyticsSummary,
    setAnalyticsSummary: (summary) =>
      set(() => ({
        analyticsSummary: summary,
      })),
  }))
);
