"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { nanoid } from "nanoid";
import {
  Archive,
  ArrowLeft,
  BarChart2,
  CalendarDays,
  CircleDashed,
  Copy,
  Download,
  Edit2,
  FileText,
  Filter,
  Flag,
  Forward,
  Image as ImageIcon,
  Info,
  Link2,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  Mic,
  MoreVertical,
  Paperclip,
  Pin,
  Reply,
  Search,
  Scissors,
  Send,
  ShieldAlert,
  Smile,
  Sticker,
  Star,
  Tag,
  Trash2,
  User2,
  Video as VideoIcon,
  Music2,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { getPlatformMeta } from "@/lib/platforms";
import { useChatStore } from "@/lib/state/use-chat-store";
import type {
  Conversation,
  Message,
  MessageAttachment,
  MessageAttachmentType,
  MessagingPlatform,
} from "@/lib/types/chat";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

type DraftAttachmentKind = MessageAttachmentType;

type DraftAttachment = {
  id: string;
  kind: DraftAttachmentKind;
  name: string;
  previewUrl?: string;
  file?: File;
  metadata?: Record<string, unknown>;
  sizeLabel?: string;
  durationSeconds?: number;
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "favorites", label: "Favorites" },
  { id: "spam", label: "Spam" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["id"];

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

const ATTACHMENT_PICKER_ITEMS: Array<{
  id: DraftAttachmentKind;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  requiresFile?: boolean;
  accept?: string;
}> = [
  {
    id: "image",
    label: "Photo",
    description: "PNG, JPG, HEIC",
    icon: ImageIcon,
    accent: "from-pink-500 to-orange-500",
    requiresFile: true,
    accept: "image/*",
  },
  {
    id: "video",
    label: "Video",
    description: "MP4, MOV",
    icon: VideoIcon,
    accent: "from-rose-500 to-purple-500",
    requiresFile: true,
    accept: "video/*",
  },
  {
    id: "audio",
    label: "Audio",
    description: "MP3, WAV",
    icon: Music2,
    accent: "from-indigo-500 to-cyan-500",
    requiresFile: true,
    accept: "audio/*",
  },
  {
    id: "voice",
    label: "Voice note",
    description: "Recordings",
    icon: Mic,
    accent: "from-sky-500 to-emerald-500",
    requiresFile: true,
    accept: "audio/*",
  },
  {
    id: "document",
    label: "Document",
    description: "PDF, DOCX",
    icon: FileText,
    accent: "from-slate-500 to-slate-700",
    requiresFile: true,
    accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip",
  },
  {
    id: "contact",
    label: "Contact",
    description: "Share details",
    icon: User2,
    accent: "from-emerald-500 to-lime-500",
  },
  {
    id: "location",
    label: "Location",
    description: "Share a pin",
    icon: MapPin,
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "poll",
    label: "Poll",
    description: "Ask a question",
    icon: BarChart2,
    accent: "from-blue-500 to-violet-500",
  },
  {
    id: "event",
    label: "Event",
    description: "Meeting invite",
    icon: CalendarDays,
    accent: "from-fuchsia-500 to-purple-500",
  },
  {
    id: "link",
    label: "Link",
    description: "Share a URL",
    icon: Link2,
    accent: "from-cyan-500 to-blue-500",
  },
  {
    id: "sticker",
    label: "Sticker",
    description: "Add some fun",
    icon: Sticker,
    accent: "from-yellow-500 to-red-500",
  },
] as const;

export function InboxView() {
  const {
    conversations,
    connections,
    tags,
    selectedConversationId,
    searchTerm,
    setSearchTerm,
    selectConversation,
    markConversationRead,
    markConversationUnread,
    togglePinConversation,
    toggleMuteConversation,
    toggleLockConversation,
    toggleArchiveConversation,
    toggleFavoriteConversation,
    toggleSpamConversation,
    deleteConversation,
    setActiveTab,
  } = useChatStore();

  const [profileConversationId, setProfileConversationId] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<MessagingPlatform | "all">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [viewArchived, setViewArchived] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const selectionActive = selectedChats.size > 0;
  const archivedCount = useMemo(
    () => conversations.filter((conversation) => conversation.isArchived).length,
    [conversations]
  );
  const availablePlatforms = useMemo(() => {
    const connected = connections
      .filter((connection) => connection.status === "connected")
      .map((connection) => connection.platform);
    const source = connected.length
      ? connected
      : conversations.map((conversation) => conversation.platform);
    const unique = Array.from(new Set(source));
    return unique
      .map((platform) => getPlatformMeta(platform))
      .filter((meta) => meta.id !== "unknown");
  }, [connections, conversations]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const effectivePlatformFilter = useMemo(() => {
    if (
      platformFilter !== "all" &&
      !availablePlatforms.some((meta) => meta.id === platformFilter)
    ) {
      return "all";
    }
    return platformFilter;
  }, [platformFilter, availablePlatforms]);

  const visibleConversations = useMemo(() => {
    return conversations
      .filter((conversation) =>
        viewArchived ? conversation.isArchived : !conversation.isArchived
      )
      .filter((conversation) => {
        switch (activeStatusFilter) {
          case "unread":
            return conversation.unreadCount > 0;
          case "favorites":
            return conversation.isFavorite === true;
          case "spam":
            return conversation.isSpam === true;
          default:
            return true;
        }
      })
      .filter((conversation) =>
        effectivePlatformFilter === "all"
          ? true
          : conversation.platform === effectivePlatformFilter
      )
      .filter((conversation) =>
        tagFilter === "all"
          ? true
          : (conversation.tags ?? []).some((tag) => tag.id === tagFilter)
      )
      .filter((conversation) => {
        if (!normalizedSearch) return true;
        const titleMatch = conversation.title.toLowerCase().includes(normalizedSearch);
        const messageMatch = conversation.messages.some((message) =>
          message.content.toLowerCase().includes(normalizedSearch)
        );
        return titleMatch || messageMatch;
      });
  }, [
    conversations,
    viewArchived,
    activeStatusFilter,
    effectivePlatformFilter,
    tagFilter,
    normalizedSearch,
  ]);

  useEffect(() => {
    if (
      selectedConversationId &&
      !visibleConversations.some((conversation) => conversation.id === selectedConversationId)
    ) {
      selectConversation(null);
    }
    if (visibleConversations.length === 0) {
      selectConversation(null);
    }
  }, [visibleConversations, selectConversation, selectedConversationId]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );

  const toggleChatSelection = (conversationId: string) => {
    setSelectedChats((current) => {
      const next = new Set(current);
      if (next.has(conversationId)) {
        next.delete(conversationId);
      } else {
        next.add(conversationId);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedChats(new Set());

  const removeFromSelection = (conversationId: string) =>
    setSelectedChats((current) => {
      if (!current.has(conversationId)) return current;
      const next = new Set(current);
      next.delete(conversationId);
      return next;
    });

  const handleSelectConversation = (conversationId: string) => {
    if (selectionActive) {
      toggleChatSelection(conversationId);
      return;
    }
    selectConversation(conversationId);
    markConversationRead(conversationId);
  };

  const openArchivedView = () => {
    setViewArchived(true);
    clearSelection();
    selectConversation(null);
  };

  const closeArchivedView = () => {
    setViewArchived(false);
    clearSelection();
    selectConversation(null);
  };

  const selectedConversations = useMemo(
    () => conversations.filter((conversation) => selectedChats.has(conversation.id)),
    [conversations, selectedChats]
  );

  type BulkAction =
    | "markRead"
    | "markUnread"
    | "archive"
    | "unarchive"
    | "pin"
    | "unpin"
    | "mute"
    | "unmute"
    | "delete";

  const handleBulkAction = (action: BulkAction) => {
    selectedConversations.forEach((conversation) => {
      switch (action) {
        case "markRead":
          if (conversation.unreadCount > 0) markConversationRead(conversation.id);
          break;
        case "markUnread":
          if (conversation.unreadCount === 0) markConversationUnread(conversation.id);
          break;
        case "archive":
          if (!conversation.isArchived) toggleArchiveConversation(conversation.id);
          break;
        case "unarchive":
          if (conversation.isArchived) toggleArchiveConversation(conversation.id);
          break;
        case "pin":
          if (!conversation.isPinned) togglePinConversation(conversation.id);
          break;
        case "unpin":
          if (conversation.isPinned) togglePinConversation(conversation.id);
          break;
        case "mute":
          if (!conversation.isMuted) toggleMuteConversation(conversation.id);
          break;
        case "unmute":
          if (conversation.isMuted) toggleMuteConversation(conversation.id);
          break;
        case "delete":
          deleteConversation(conversation.id);
          break;
        default:
          break;
      }
    });
    if (action === "delete") {
      clearSelection();
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    removeFromSelection(conversationId);
  };

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border">
        <div className="px-4 py-3">
          {viewArchived ? (
            <button
              type="button"
              onClick={closeArchivedView}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-left"
            >
              <ArrowLeft className="h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">Archived</p>
                <p className="text-xs text-muted-foreground">{archivedCount} chats</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <Avatar className="h-9 w-9">
                <AvatarFallback>RC</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <CircleDashed className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setActiveTab("settings")}>Settings</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("notifications")}>
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("tags")}>
                      Labels
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("members")}>
                      Team
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("connect")}>
                      Linked services
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("analytics")}>
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast.info("Logging out")}>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
        {!viewArchived && (
          <>
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search or start new chat"
                  className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilterPanel((prev) => !prev)}
                  aria-pressed={showFilterPanel}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {showFilterPanel && (
              <div className="space-y-2 px-3 pb-2">
                <div className="flex items-center gap-3">
                  <ScrollArea className="max-w-[240px] overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto py-1">
                      <button
                        type="button"
                        onClick={() => setPlatformFilter("all")}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border transition",
                          effectivePlatformFilter === "all"
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        )}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">All channels</span>
                      </button>
                      {availablePlatforms.map((meta) => {
                        const isActive = effectivePlatformFilter === meta.id;
                        const Icon = meta.icon;
                        return (
                          <button
                            key={meta.id}
                            type="button"
                            onClick={() => setPlatformFilter(meta.id)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full border transition",
                              isActive
                                ? "border-secondary bg-secondary text-secondary-foreground"
                                : "border-border bg-background text-muted-foreground"
                            )}
                            title={meta.name}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="sr-only">{meta.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={tagFilter === "all" ? "outline" : "secondary"}
                        size="icon"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-0">
                      <Command>
                        <CommandInput placeholder="Search labels" />
                        <CommandList>
                          <CommandEmpty>No labels found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setTagFilter("all");
                                setTagPopoverOpen(false);
                              }}
                            >
                              All labels
                            </CommandItem>
                            {tags.map((tag) => (
                              <CommandItem
                                key={tag.id}
                                value={tag.label}
                                onSelect={() => {
                                  setTagFilter(tag.id);
                                  setTagPopoverOpen(false);
                                }}
                              >
                                {tag.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => {
                  const isActive = activeStatusFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveStatusFilter(filter.id)}
                    >
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn("cursor-pointer px-3 py-1 text-[11px]", isActive && "shadow-sm")}
                      >
                        {filter.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 pb-3">
            {archivedCount > 0 && !viewArchived && (
              <button
                type="button"
                onClick={openArchivedView}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Archive className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Archived</p>
                    <p className="text-xs text-muted-foreground">{archivedCount} chats</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  View
                </Badge>
              </button>
            )}
            {visibleConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                isChecked={selectedChats.has(conversation.id)}
                selectionActive={selectionActive}
                selectedCount={selectedChats.size}
                onSelect={() => handleSelectConversation(conversation.id)}
                onToggleSelection={() => toggleChatSelection(conversation.id)}
                onMarkRead={() => markConversationRead(conversation.id)}
                onMarkUnread={() => markConversationUnread(conversation.id)}
                onArchive={() => toggleArchiveConversation(conversation.id)}
                onPin={() => togglePinConversation(conversation.id)}
                onMute={() => toggleMuteConversation(conversation.id)}
                onLock={() => toggleLockConversation(conversation.id)}
                onDelete={() => handleDeleteConversation(conversation.id)}
                onFavorite={() => toggleFavoriteConversation(conversation.id)}
                onSpam={() => toggleSpamConversation(conversation.id)}
                onViewProfile={() => setProfileConversationId(conversation.id)}
                onBulkAction={handleBulkAction}
                onClearSelection={clearSelection}
              />
            ))}
            {visibleConversations.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <p>No conversations found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-muted/20">
        {selectedConversation ? (
          <ConversationDetail
            key={selectedConversation.id}
            conversationId={selectedConversation.id}
            onOpenProfile={() => setProfileConversationId(selectedConversation.id)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageCircle className="h-8 w-8" />
            <p>Select a conversation to get started.</p>
          </div>
        )}
      </section>

      <ProfileSheet
        conversation={conversations.find((item) => item.id === profileConversationId) ?? null}
        open={Boolean(profileConversationId)}
        onClose={() => setProfileConversationId(null)}
      />
    </div>
  );
}

type ConversationRowProps = {
  conversation: Conversation;
  isSelected: boolean;
  isChecked: boolean;
  selectionActive: boolean;
  selectedCount: number;
  onSelect: () => void;
  onToggleSelection: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onArchive: () => void;
  onPin: () => void;
  onMute: () => void;
  onLock: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onSpam: () => void;
  onViewProfile: () => void;
  onBulkAction: (action: BulkAction) => void;
  onClearSelection: () => void;
};

function ConversationRow({
  conversation,
  isSelected,
  isChecked,
  selectionActive,
  selectedCount,
  onSelect,
  onToggleSelection,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onPin,
  onMute,
  onLock,
  onDelete,
  onFavorite,
  onSpam,
  onViewProfile,
  onBulkAction,
  onClearSelection,
}: ConversationRowProps) {
  const meta = getPlatformMeta(conversation.platform);
  const lastMessage = conversation.messages.at(-1);
  const preview = lastMessage?.content ?? "No messages yet";
  const timestamp = lastMessage ? dayjs(lastMessage.createdAt).format("HH:mm") : "";
  const hasUnread = conversation.unreadCount > 0;
  const showCheckbox = isChecked;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
            isSelected ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
          )}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{conversation.title.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full bg-background/90 transition",
                showCheckbox
                  ? "pointer-events-auto opacity-100 shadow"
                  : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleSelection()}
                onClick={(event) => event.stopPropagation()}
                aria-label="Select chat"
                className="h-4 w-4"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{conversation.title}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <meta.icon className="h-3.5 w-3.5" />
                </span>
                {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                {conversation.isFavorite && (
                  <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
                )}
                {conversation.isSpam && <ShieldAlert className="h-3.5 w-3.5 text-destructive" />}
              </div>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{preview}</p>
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {conversation.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-[10px]">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {hasUnread && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {conversation.unreadCount}
            </span>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onViewProfile}>Contact info</ContextMenuItem>
        <ContextMenuItem onSelect={() => onToggleSelection()}>
          {isChecked ? "Unselect chat" : "Select chat"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onFavorite}>
          {conversation.isFavorite ? "Remove from favourites" : "Add to favourites"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onSpam}>
          {conversation.isSpam ? "Not spam" : "Mark as spam"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onPin}>
          {conversation.isPinned ? "Unpin chat" : "Pin chat"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onMute}>
          {conversation.isMuted ? "Unmute notifications" : "Mute notifications"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={hasUnread ? onMarkRead : onMarkUnread}>
          {hasUnread ? "Mark as read" : "Mark as unread"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onArchive}>
          {conversation.isArchived ? "Unarchive chat" : "Archive chat"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onLock}>
          {conversation.isLocked ? "Unlock chat" : "Lock chat"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => toast.info("Export chat is coming soon")}>
          Export chat
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => toast.info("Clear chat is coming soon")}>
          Clear chat
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onSelect={onDelete}>
          Delete chat
        </ContextMenuItem>
        {selectionActive && (
          <>
            <ContextMenuSeparator />
            <ContextMenuLabel>
              Selected ({selectedCount})
            </ContextMenuLabel>
            <ContextMenuItem onSelect={() => onBulkAction("markRead")}>
              Mark selected read
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("markUnread")}>
              Mark selected unread
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("pin")}>
              Pin selected
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("unpin")}>
              Unpin selected
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("mute")}>
              Mute selected
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("unmute")}>
              Unmute selected
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("archive")}>
              Archive selected
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onBulkAction("unarchive")}>
              Unarchive selected
            </ContextMenuItem>
            <ContextMenuItem className="text-destructive" onSelect={() => onBulkAction("delete")}>
              Delete selected
            </ContextMenuItem>
            <ContextMenuItem onSelect={onClearSelection}>Clear selection</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

type ConversationDetailProps = {
  conversationId: string;
  onOpenProfile: () => void;
};

function ConversationDetail({ conversationId, onOpenProfile }: ConversationDetailProps) {
  const {
    conversations,
    teamMembers,
    markConversationRead,
    markConversationUnread,
    toggleArchiveConversation,
    togglePinConversation,
    toggleMuteConversation,
    toggleLockConversation,
    toggleFavoriteConversation,
    toggleSpamConversation,
    deleteConversation,
    sendMessage,
    deleteMessage,
    toggleStarMessage,
    togglePinMessage,
    editMessage,
    toggleReaction,
  } = useChatStore();

  const conversation = conversations.find((item) => item.id === conversationId);
  const [draft, setDraft] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<DraftAttachment[]>([]);
  const [pendingFileKind, setPendingFileKind] = useState<DraftAttachmentKind | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!conversation) return null;

  const meta = getPlatformMeta(conversation.platform);
  const currentUserId = teamMembers[0]?.id ?? "member_local";
  const editingMessage = editingMessageId
    ? conversation.messages.find((message) => message.id === editingMessageId) ?? null
    : null;

  const handleAttachmentPick = (kind: DraftAttachmentKind) => {
    const option = ATTACHMENT_PICKER_ITEMS.find((item) => item.id === kind);
    if (option?.requiresFile) {
      setPendingFileKind(kind);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.accept = option.accept ?? "*/*";
        fileInputRef.current.click();
      }
      return;
    }
    setComposerAttachments((current) => [...current, createTemplateDraft(kind)]);
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files?.length) {
      setPendingFileKind(null);
      return;
    }
    const kind = pendingFileKind ?? "document";
    const drafts = Array.from(files).map((file) => {
      const id = nanoid(8);
      const previewUrl =
        kind === "image" || kind === "video" || kind === "sticker"
          ? URL.createObjectURL(file)
          : undefined;
      return {
        id: `draft_${id}`,
        kind,
        name: file.name,
        file,
        previewUrl,
        sizeLabel: formatBytes(file.size),
      } satisfies DraftAttachment;
    });
    setComposerAttachments((prev) => [...prev, ...drafts]);
    setPendingFileKind(null);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setComposerAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleCopyMessage = (message: Message) => {
    if (!message.content) return;
    navigator.clipboard
      ?.writeText(message.content)
      .then(() => toast.success("Message copied"))
      .catch(() => toast.error("Unable to copy message"));
  };

  const handleDownloadAttachments = (message: Message) => {
    if (!message.attachments?.length) {
      toast.info("No attachments to download");
      return;
    }
    message.attachments.forEach((attachment) => {
      if (attachment.downloadUrl) {
        window.open(attachment.downloadUrl, "_blank");
      } else if (attachment.previewUrl) {
        window.open(attachment.previewUrl, "_blank");
      }
    });
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setDraft(message.content);
    setReplyingMessage(null);
    setComposerAttachments([]);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setDraft("");
  };

  const handleReply = (message: Message) => {
    setReplyingMessage(message);
  };

  const cancelReply = () => setReplyingMessage(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() && composerAttachments.length === 0) {
      return;
    }

    if (editingMessageId) {
      if (!draft.trim()) {
        toast.error("Edited message cannot be empty");
        return;
      }
      editMessage(conversation.id, editingMessageId, draft.trim());
      cancelEditing();
      setDraft("");
      return;
    }

    const preparedAttachments: MessageAttachment[] | undefined = composerAttachments.length
      ? composerAttachments.map(convertDraftToMessageAttachment)
      : undefined;

    const metadata =
      replyingMessage != null
        ? {
            replyTo: replyingMessage.id,
            replyPreview: replyingMessage.content,
            replyAuthor: replyingMessage.isInbound ? conversation.title : "You",
          }
        : undefined;

    sendMessage(conversation.id, {
      content: draft.trim(),
      attachments: preparedAttachments,
      metadata,
    });

    setDraft("");
    setComposerAttachments([]);
    setReplyingMessage(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(conversation.id, messageId);
    if (editingMessageId === messageId) {
      cancelEditing();
    }
    if (replyingMessage?.id === messageId) {
      cancelReply();
    }
  };

  const hasUnread = conversation.unreadCount > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-3"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback>{conversation.title.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {conversation.title}
              <Badge variant="secondary" className="text-[10px] uppercase">
                {meta.name}
              </Badge>
              {conversation.isFavorite && (
                <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
              )}
              {conversation.isSpam && (
                <Badge variant="destructive" className="text-[10px] uppercase">
                  Spam
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{dayjs(conversation.lastMessageAt).fromNow()}</p>
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onOpenProfile()}>Contact info</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleFavoriteConversation(conversation.id)}>
              {conversation.isFavorite ? "Remove from favourites" : "Add to favourites"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleSpamConversation(conversation.id)}>
              {conversation.isSpam ? "Not spam" : "Mark as spam"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => togglePinConversation(conversation.id)}>
              {conversation.isPinned ? "Unpin chat" : "Pin chat"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleMuteConversation(conversation.id)}>
              {conversation.isMuted ? "Unmute notifications" : "Mute notifications"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                hasUnread
                  ? markConversationRead(conversation.id)
                  : markConversationUnread(conversation.id)
              }
            >
              {hasUnread ? "Mark as read" : "Mark as unread"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleArchiveConversation(conversation.id)}>
              {conversation.isArchived ? "Unarchive chat" : "Archive chat"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleLockConversation(conversation.id)}>
              {conversation.isLocked ? "Unlock chat" : "Lock chat"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info("Export chat is coming soon")}>
              Export chat
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.info("Clear chat is coming soon")}>
              Clear chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => deleteConversation(conversation.id)}
            >
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 bg-background px-6 py-4">
        <div className="space-y-3">
          {conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              onDelete={() => handleDeleteMessage(message.id)}
              onReply={() => handleReply(message)}
              onForward={() => toast.info("Forward coming soon")}
              onFavorite={() => toggleStarMessage(conversation.id, message.id)}
              onInfo={() => toast.info("Message info coming soon")}
              onCopy={() => handleCopyMessage(message)}
              onDownload={() => handleDownloadAttachments(message)}
              onPin={() => togglePinMessage(conversation.id, message.id)}
              onReport={() => toast.success("Message reported")}
              onEdit={() => handleStartEdit(message)}
              onReact={(emoji) => toggleReaction(conversation.id, message.id, emoji, currentUserId)}
            />
          ))}
        </div>
      </ScrollArea>

      {replyingMessage && (
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs">
          <div>
            <p className="text-muted-foreground">Replying to {replyingMessage.isInbound ? conversation.title : "You"}</p>
            <p className="line-clamp-1 font-medium">{replyingMessage.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={cancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {editingMessage && (
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs">
          <div>
            <p className="text-muted-foreground">Editing message</p>
            <p className="line-clamp-1 font-medium">{editingMessage.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={cancelEditing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {composerAttachments.length > 0 && (
        <div className="space-y-3 border-t border-border bg-muted/40 px-4 py-3">
          {composerAttachments.map((attachment) => (
            <AttachmentComposerPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => handleRemoveAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border bg-background px-4 py-3"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {ATTACHMENT_PICKER_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => handleAttachmentPick(item.id)}
                className="cursor-pointer"
              >
                <span
                  className={cn(
                    "mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-white",
                    item.accent
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="rounded-full" type="button">
          <Smile className="h-5 w-5" />
        </Button>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="flex-1 resize-none rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={composerAttachments.length > 0 || replyingMessage ? 2 : 1}
          placeholder={editingMessage ? "Edit message" : "Type a message"}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => handleFileSelection(event.target.files)}
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  onDelete: () => void;
  onReply: () => void;
  onForward: () => void;
  onFavorite: () => void;
  onInfo: () => void;
  onReact: (emoji: string) => void;
  onCopy: () => void;
  onDownload: () => void;
  onPin: () => void;
  onReport: () => void;
  onEdit: () => void;
};

function MessageBubble({
  message,
  isOwn,
  onDelete,
  onReply,
  onForward,
  onFavorite,
  onInfo,
  onReact,
  onCopy,
  onDownload,
  onPin,
  onReport,
  onEdit,
}: MessageBubbleProps) {
  const timestamp = dayjs(message.createdAt).format("HH:mm");
  const canEdit =
    isOwn &&
    dayjs(message.createdAt).isAfter(dayjs().subtract(15, "minute")) &&
    (message.attachments?.length ?? 0) === 0;
  const reactionMap = groupReactions(message.reactions);

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "relative max-w-[70%] rounded-2xl px-3 py-2 shadow-sm",
              isOwn ? "bg-secondary text-secondary-foreground" : "bg-muted"
            )}
          >
            {message.isPinned && (
              <div className="absolute -top-4 right-2 flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
                <Pin className="h-3 w-3" /> Pinned
              </div>
            )}
            {message.metadata && (message.metadata as Record<string, string>).replyPreview && (
              <div className="mb-2 rounded-lg border border-border/60 bg-background/70 p-2 text-xs">
                <p className="font-medium">
                  {(message.metadata as Record<string, string>).replyAuthor ?? "Unknown"}
                </p>
                <p className="line-clamp-2 text-muted-foreground">
                  {(message.metadata as Record<string, string>).replyPreview}
                </p>
              </div>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <AttachmentBubblePreview key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}
            {message.content && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted-foreground">
              {message.isStarred && <Star className="h-3 w-3" />}
              {message.editedAt && <span>Edited</span>}
              <span>{timestamp}</span>
            </div>
            {reactionMap.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {reactionMap.map(({ emoji, count }) => (
                  <span
                    key={emoji}
                    className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-xs"
                  >
                    {emoji} <span className="text-[10px] text-muted-foreground">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onReply}>
            <Reply className="mr-2 h-4 w-4" /> Reply
          </ContextMenuItem>
          <ContextMenuItem onSelect={onForward}>
            <Forward className="mr-2 h-4 w-4" /> Forward
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>React</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {REACTION_EMOJIS.map((emoji) => (
                <ContextMenuItem key={emoji} onSelect={() => onReact(emoji)}>
                  {emoji}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onSelect={onCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </ContextMenuItem>
          <ContextMenuItem onSelect={onDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </ContextMenuItem>
          <ContextMenuItem onSelect={onPin}>
            <Pin className="mr-2 h-4 w-4" /> {message.isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
          <ContextMenuItem onSelect={onFavorite}>
            <Star className="mr-2 h-4 w-4" />
            {message.isStarred ? "Remove star" : "Star"}
          </ContextMenuItem>
          <ContextMenuItem onSelect={onInfo}>
            <Info className="mr-2 h-4 w-4" /> Message info
          </ContextMenuItem>
          <ContextMenuItem onSelect={onReport}>
            <Flag className="mr-2 h-4 w-4" /> Report
          </ContextMenuItem>
          <ContextMenuItem disabled={!canEdit} onSelect={() => canEdit && onEdit()}>
            <Edit2 className="mr-2 h-4 w-4" /> Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onSelect={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete message
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

type AttachmentComposerPreviewProps = {
  attachment: DraftAttachment;
  onRemove: () => void;
};

function AttachmentComposerPreview({ attachment, onRemove }: AttachmentComposerPreviewProps) {
  const label =
    ATTACHMENT_PICKER_ITEMS.find((item) => item.id === attachment.kind)?.label ?? "Attachment";

  const renderBody = () => {
    switch (attachment.kind) {
      case "image":
      case "sticker":
        return (
          <>
            <div className="mt-2 overflow-hidden rounded-xl border border-dashed border-border/60 bg-black/5">
              {attachment.previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachment.previewUrl} alt={attachment.name} className="w-full object-cover" />
                </>
              ) : (
                <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                  Image preview
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Button variant="ghost" size="sm" className="gap-1">
                <Scissors className="h-3 w-3" /> Crop
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <RotateCcw className="h-3 w-3" /> Rotate
              </Button>
            </div>
            <Input className="mt-2 text-xs" placeholder="Add caption" />
          </>
        );
      case "video":
        return (
          <>
            <div className="mt-2 overflow-hidden rounded-xl border border-dashed border-border/60 bg-black/5">
              {attachment.previewUrl ? (
                <video controls src={attachment.previewUrl} className="w-full" />
              ) : (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                  Video preview
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Button variant="ghost" size="sm" className="gap-1">
                <Scissors className="h-3 w-3" /> Trim
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <ImageIcon className="h-3 w-3" /> Cover
              </Button>
            </div>
            <Input className="mt-2 text-xs" placeholder="Add caption" />
          </>
        );
      case "audio":
      case "voice":
        return (
          <div className="mt-2 rounded-xl border border-dashed border-border/60 bg-background/80 p-3">
            <audio controls src={attachment.previewUrl} className="w-full" />
            <p className="mt-2 text-xs text-muted-foreground">{attachment.name}</p>
          </div>
        );
      case "document":
        return (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-background/80 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">{attachment.sizeLabel ?? "Document"}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">
              Doc
            </Badge>
          </div>
        );
      case "contact":
        return (
          <div className="mt-2 rounded-xl border border-dashed border-border/60 bg-background/80 p-3 text-xs">
            <p className="text-sm font-semibold">
              {(attachment.metadata?.contact as { name?: string })?.name ?? attachment.name}
            </p>
            <p className="text-muted-foreground">
              {(attachment.metadata?.contact as { phone?: string })?.phone ?? "+1 (555) 010-2020"}
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" className="text-xs">
                Message
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                Add contact
              </Button>
            </div>
          </div>
        );
      case "location":
        return (
          <div className="mt-2 overflow-hidden rounded-xl border border-dashed border-border/60">
            <div className="h-32 bg-gradient-to-br from-emerald-500/40 to-emerald-700/40">
              <div className="flex h-full items-center justify-center text-xs text-white/70">
                Map preview
              </div>
            </div>
            <div className="px-3 py-2 text-xs">
              <p className="font-semibold">
                {(attachment.metadata?.location as { title?: string })?.title ?? attachment.name}
              </p>
              <p className="text-muted-foreground">
                {(attachment.metadata?.location as { subtitle?: string })?.subtitle ?? "Shared location"}
              </p>
            </div>
          </div>
        );
      case "poll":
        return (
          <div className="mt-2 space-y-2 rounded-xl border border-dashed border-border/60 bg-background/80 p-3 text-xs">
            <p className="font-semibold">
              {(attachment.metadata?.poll as { question?: string })?.question ?? attachment.name}
            </p>
            {((attachment.metadata?.poll as { options?: Array<{ id: string; label: string }> })
              ?.options ?? []
            ).map((option) => (
              <div key={option.id} className="rounded-lg border border-border/60 bg-background px-2 py-1.5">
                {option.label}
              </div>
            ))}
          </div>
        );
      case "event":
        return (
          <div className="mt-2 rounded-xl border border-dashed border-border/60 bg-background/80 p-3 text-xs">
            <p className="font-semibold">
              {(attachment.metadata?.event as { title?: string })?.title ?? attachment.name}
            </p>
            <p className="text-muted-foreground">
              {dayjs((attachment.metadata?.event as { date?: string })?.date ?? new Date().toISOString()).format(
                "MMM D, h:mm A"
              )}
            </p>
          </div>
        );
      case "link":
        return (
          <div className="mt-2 rounded-xl border border-dashed border-border/60 bg-background/80 p-3 text-xs">
            <p className="font-semibold">
              {(attachment.metadata?.link as { title?: string })?.title ?? attachment.name}
            </p>
            <p className="line-clamp-2 text-muted-foreground">
              {(attachment.metadata?.link as { description?: string })?.description ?? "Shared link"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {(attachment.metadata?.link as { url?: string })?.url ?? "https://example.com"}
            </p>
          </div>
        );
      default:
        return (
          <div className="mt-2 rounded-xl border border-dashed border-border/60 bg-background/80 p-3 text-xs text-muted-foreground">
            Attachment ready to send.
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background/80 p-3 text-xs">
      <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          {attachment.sizeLabel && <span className="text-[10px] text-muted-foreground">{attachment.sizeLabel}</span>}
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {renderBody()}
    </div>
  );
}

type AttachmentBubblePreviewProps = {
  attachment: MessageAttachment;
};

function AttachmentBubblePreview({ attachment }: AttachmentBubblePreviewProps) {
  switch (attachment.type) {
    case "image":
    case "sticker":
      return (
        <div className="overflow-hidden rounded-xl bg-black/10">
          {attachment.previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.previewUrl} alt={attachment.name} className="w-full object-cover" />
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              Image preview unavailable
            </div>
          )}
        </div>
      );
    case "video":
      return (
        <div className="overflow-hidden rounded-xl bg-black/10">
          {attachment.previewUrl ? (
            <video controls src={attachment.previewUrl} className="w-full" />
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
              Video preview unavailable
            </div>
          )}
        </div>
      );
    case "audio":
    case "voice":
      return (
        <div className="rounded-xl border border-border/70 bg-background/80 p-2">
          <audio controls src={attachment.previewUrl} className="w-full" />
        </div>
      );
    case "document":
      return (
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-2 py-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{attachment.name}</span>
          </div>
          <Download className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    case "contact":
      return (
        <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs">
          <p className="font-semibold">{attachment.contact?.name ?? attachment.name}</p>
          <p className="text-muted-foreground">{attachment.contact?.phone ?? "+1 (555) 010-2020"}</p>
        </div>
      );
    case "location":
      return (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="h-28 bg-gradient-to-br from-emerald-500/30 to-emerald-700/40" />
          <div className="px-3 py-2 text-xs">
            <p className="font-semibold">{attachment.location?.title ?? attachment.name}</p>
            <p className="text-muted-foreground">{attachment.location?.subtitle ?? "Shared location"}</p>
          </div>
        </div>
      );
    case "poll":
      return (
        <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs">
          <p className="font-semibold">{attachment.poll?.question ?? attachment.name}</p>
          <div className="mt-2 space-y-1">
            {(attachment.poll?.options ?? []).map((option) => (
              <div key={option.id} className="rounded-lg border border-border/50 bg-background px-2 py-1">
                {option.label}
              </div>
            ))}
          </div>
        </div>
      );
    case "event":
      return (
        <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs">
          <p className="font-semibold">{attachment.event?.title ?? attachment.name}</p>
          <p className="text-muted-foreground">
            {dayjs(attachment.event?.date ?? new Date().toISOString()).format("MMM D, h:mm A")}
          </p>
        </div>
      );
    case "link":
      return (
        <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs">
          <p className="font-semibold">{attachment.link?.title ?? attachment.name}</p>
          <p className="line-clamp-2 text-muted-foreground">
            {attachment.link?.description ?? attachment.link?.url}
          </p>
        </div>
      );
    default:
      return (
        <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
          Attachment
        </div>
      );
  }
}

function createTemplateDraft(kind: DraftAttachmentKind): DraftAttachment {
  switch (kind) {
    case "contact":
      return {
        id: `draft_contact_${nanoid(6)}`,
        kind,
        name: "New contact",
        metadata: {
          contact: { name: "Alex Morgan", phone: "+1 (555) 010-2020" },
        },
      };
    case "location":
      return {
        id: `draft_location_${nanoid(6)}`,
        kind,
        name: "Pinned location",
        metadata: {
          location: {
            title: "Robocall HQ",
            subtitle: "123 Queen Street",
          },
        },
      };
    case "poll":
      return {
        id: `draft_poll_${nanoid(6)}`,
        kind,
        name: "Quick poll",
        metadata: {
          poll: {
            question: "Which option works best?",
            options: [
              { id: "opt_a", label: "Option A" },
              { id: "opt_b", label: "Option B" },
              { id: "opt_c", label: "Option C" },
            ],
          },
        },
      };
    case "event":
      return {
        id: `draft_event_${nanoid(6)}`,
        kind,
        name: "Calendar invite",
        metadata: {
          event: {
            title: "Product Review",
            date: new Date().toISOString(),
            location: "Virtual",
          },
        },
      };
    case "link":
      return {
        id: `draft_link_${nanoid(6)}`,
        kind,
        name: "robocall.ai",
        metadata: {
          link: {
            url: "https://robocall.ai",
            title: "Robocall AI",
            description: "Unified omni-channel inbox and AI assistant.",
          },
        },
      };
    case "sticker":
      return {
        id: `draft_sticker_${nanoid(6)}`,
        kind,
        name: "Fun sticker",
        previewUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop",
      };
    default:
      return {
        id: `draft_${kind}_${nanoid(6)}`,
        kind,
        name: `${kind} attachment`,
      };
  }
}

function convertDraftToMessageAttachment(attachment: DraftAttachment): MessageAttachment {
  const base: MessageAttachment = {
    id: attachment.id,
    type: attachment.kind,
    name: attachment.name,
    previewUrl: attachment.previewUrl,
    sizeInBytes: attachment.file?.size,
  };

  switch (attachment.kind) {
    case "contact":
      return { ...base, contact: attachment.metadata?.contact as MessageAttachment["contact"] };
    case "location":
      return { ...base, location: attachment.metadata?.location as MessageAttachment["location"] };
    case "poll":
      return { ...base, poll: attachment.metadata?.poll as MessageAttachment["poll"] };
    case "event":
      return { ...base, event: attachment.metadata?.event as MessageAttachment["event"] };
    case "link":
      return { ...base, link: attachment.metadata?.link as MessageAttachment["link"] };
    default:
      return base;
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(1)} ${units[index]}`;
}

function groupReactions(reactions?: Message["reactions"]) {
  if (!reactions?.length) return [];
  const counts: Record<string, number> = {};
  reactions.forEach((reaction) => {
    counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
  });
  return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
}
type ProfileSheetProps = {
  conversation: Conversation | null;
  open: boolean;
  onClose: () => void;
};

function ProfileSheet({ conversation, open, onClose }: ProfileSheetProps) {
  if (!conversation) return null;
  const platform = getPlatformMeta(conversation.platform);
  const participant = conversation.participants[0];

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-[320px] space-y-4 border-l border-border p-0">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Contact info</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full px-4 py-4">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{conversation.title.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-sm font-semibold">{conversation.title}</p>
                <p className="text-xs text-muted-foreground">{platform.name}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Phone / Handle</p>
                <p className="font-medium">
                  {participant?.handle ?? participant?.email ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tags</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(conversation.tags ?? []).map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-[10px]">
                      {tag.label}
                    </Badge>
                  ))}
                  {conversation.tags?.length === 0 && <p>Not tagged</p>}
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">Shared media</p>
              <p>No media yet.</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
