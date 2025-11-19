"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Archive,
  ArrowLeft,
  Camera,
  CircleDashed,
  Download,
  FileText,
  Filter,
  Forward,
  Info,
  MessageCircle,
  MessageSquarePlus,
  Mic,
  MoreVertical,
  Paperclip,
  Pin,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Star,
  Tag,
  Trash2,
  User2,
} from "lucide-react";
import { toast } from "sonner";

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
import type { Conversation, Message, MessageAttachment, MessagingPlatform } from "@/lib/types/chat";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

type DraftAttachment = {
  id: string;
  type: "document" | "image" | "contact" | "audio";
  name: string;
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "favorites", label: "Favorites" },
  { id: "spam", label: "Spam" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["id"];

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
  } = useChatStore();

  const conversation = conversations.find((item) => item.id === conversationId);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!conversation) return null;

  const meta = getPlatformMeta(conversation.platform);
  const hasUnread = conversation.unreadCount > 0;

  const handleAddAttachment = (type: DraftAttachment["type"], name: string) => {
    if (type === "document") {
      fileInputRef.current?.click();
      return;
    }
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    setAttachments((current) => [...current, { id, type, name }]);
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).map((file) => ({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      type: "document" as const,
      name: file.name,
    }));
    setAttachments((current) => [...current, ...selected]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() && attachments.length === 0) {
      return;
    }

    const preparedAttachments: MessageAttachment[] | undefined = attachments.length
      ? attachments.map((attachment) => ({
          id: attachment.id,
          type:
            attachment.type === "image"
              ? "image"
              : attachment.type === "audio"
              ? "audio"
              : attachment.type === "contact"
              ? "other"
              : "document",
          name: attachment.name,
        }))
      : undefined;

    sendMessage(conversation.id, {
      content: draft.trim(),
      attachments: preparedAttachments,
    });

    setDraft("");
    setAttachments([]);
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(conversation.id, messageId);
  };

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
              onDelete={() => handleDeleteMessage(message.id)}
              onReply={() => toast.info("Reply coming soon")}
              onForward={() => toast.info("Forward coming soon")}
              onFavorite={() => toggleStarMessage(conversation.id, message.id)}
              onInfo={() => toast.info("Message info coming soon")}
            />
          ))}
        </div>
      </ScrollArea>

      {attachments.length > 0 && (
        <div className="space-y-2 border-t border-border bg-muted/40 px-4 py-2 text-xs">
          <p className="font-medium">Attachments</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <Badge key={attachment.id} variant="outline" className="gap-2">
                {attachment.name}
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((item) => item.id !== attachment.id)
                    )
                  }
                  className="rounded-full px-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-background px-4 py-3"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onSelect={() => handleAddAttachment("document", "Document.pdf")}>
              <FileText className="mr-2 h-4 w-4" /> Document
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleAddAttachment("image", "Photo.jpg")}>
              <Camera className="mr-2 h-4 w-4" /> Photo
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleAddAttachment("contact", "New contact")}>
              <User2 className="mr-2 h-4 w-4" /> Contact
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleAddAttachment("audio", "Voice note.m4a")}>
              <Mic className="mr-2 h-4 w-4" /> Audio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="rounded-full" type="button">
          <Smile className="h-5 w-5" />
        </Button>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="flex-1 resize-none rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={1}
          placeholder="Type a message"
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => handleFileSelection(event.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => toast.info("Voice message coming soon")}
        >
          <Mic className="h-5 w-5" />
        </Button>
        <Button type="submit" size="icon" className="rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

type MessageBubbleProps = {
  message: Message;
  onDelete: () => void;
  onReply: () => void;
  onForward: () => void;
  onFavorite: () => void;
  onInfo: () => void;
};

function MessageBubble({ message, onDelete, onReply, onForward, onFavorite, onInfo }: MessageBubbleProps) {
  const isOutbound = !message.isInbound;
  const timestamp = dayjs(message.createdAt).format("HH:mm");

  return (
    <div className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
              isOutbound ? "bg-secondary text-secondary-foreground" : "bg-muted"
            )}
          >
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 space-y-1 text-xs">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>{attachment.name ?? attachment.type}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" type="button">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {message.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>}
            <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
              {message.isStarred && <Star className="h-3 w-3" />}
              <span>{timestamp}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onReply}>
            <Reply className="mr-2 h-4 w-4" /> Reply
          </ContextMenuItem>
          <ContextMenuItem onSelect={onForward}>
            <Forward className="mr-2 h-4 w-4" /> Forward
          </ContextMenuItem>
          <ContextMenuItem onSelect={onFavorite}>
            <Star className="mr-2 h-4 w-4" />
            {message.isStarred ? "Remove from favorites" : "Add to favorites"}
          </ContextMenuItem>
          <ContextMenuItem onSelect={onInfo}>
            <Info className="mr-2 h-4 w-4" /> Message info
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
