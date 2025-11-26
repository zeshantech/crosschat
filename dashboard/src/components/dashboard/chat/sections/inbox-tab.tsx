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
  Check,
  ChevronRight,
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
  Phone,
  Pin,
  Plus,
  Reply,
  Search,
  Scissors,
  Send,
  ShieldAlert,
  Smile,
  Star,
  Tag,
  Trash2,
  User2,
  Video as VideoIcon,
  Music2,
  RotateCcw,
  X,
  Clock,
  Settings,
  Bell,
  Users,
  Link as LinkIcon,
  LogOut,
  CheckCheck,
  BellOff,
  Lock,
  Unlock,
  FileDown,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { EmojiPicker } from "@ferrucc-io/emoji-picker";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
                    <DropdownMenuItem onSelect={() => setActiveTab("settings")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("notifications")}>
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("tags")}>
                      <Tag className="h-4 w-4 mr-2" />
                      Labels
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("members")}>
                      <Users className="h-4 w-4 mr-2" />
                      Team
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("connect")}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Linked services
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("analytics")}>
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast.info("Logging out")}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
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
        <ContextMenuItem onSelect={onViewProfile}>
          <Info className="h-4 w-4 mr-2" />
          Contact info
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onToggleSelection()}>
          <CheckCheck className="h-4 w-4 mr-2" />
          {isChecked ? "Unselect chat" : "Select chat"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onFavorite}>
          <Star className="h-4 w-4 mr-2" />
          {conversation.isFavorite ? "Remove from favourites" : "Add to favourites"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onSpam}>
          <ShieldAlert className="h-4 w-4 mr-2" />
          {conversation.isSpam ? "Not spam" : "Mark as spam"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onPin}>
          <Pin className="h-4 w-4 mr-2" />
          {conversation.isPinned ? "Unpin chat" : "Pin chat"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onMute}>
          {conversation.isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
          {conversation.isMuted ? "Unmute notifications" : "Mute notifications"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={hasUnread ? onMarkRead : onMarkUnread}>
          <CheckCheck className="h-4 w-4 mr-2" />
          {hasUnread ? "Mark as read" : "Mark as unread"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onArchive}>
          <Archive className="h-4 w-4 mr-2" />
          {conversation.isArchived ? "Unarchive chat" : "Archive chat"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onLock}>
          {conversation.isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
          {conversation.isLocked ? "Unlock chat" : "Lock chat"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => toast.info("Export chat is coming soon")}>
          <FileDown className="h-4 w-4 mr-2" />
          Export chat
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => toast.info("Clear chat is coming soon")}>
          <Eraser className="h-4 w-4 mr-2" />
          Clear chat
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onSelect={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
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
  const [showMediaComposer, setShowMediaComposer] = useState(false);
  const [showNumberModal, setShowNumberModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("+1 (555) 123-4567");
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  if (!conversation) return null;

  const meta = getPlatformMeta(conversation.platform);
  const currentUserId = teamMembers[0]?.id ?? "member_local";
  const editingMessage = editingMessageId
    ? conversation.messages.find((message) => message.id === editingMessageId) ?? null
    : null;

  const handleAttachmentPick = (kind: DraftAttachmentKind) => {
    const option = ATTACHMENT_PICKER_ITEMS.find((item) => item.id === kind);

    // Special handling for poll, event, and location
    if (kind === "poll") {
      setShowPollDialog(true);
      return;
    }

    if (kind === "event") {
      setShowEventDialog(true);
      return;
    }

    if (kind === "location") {
      setShowLocationDialog(true);
      return;
    }

    if (option?.requiresFile) {
      setPendingFileKind(kind);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.accept = option.accept ?? "*/*";
        // Allow multiple files for images and videos
        if (kind === "image" || kind === "video") {
          fileInputRef.current.multiple = true;
        } else {
          fileInputRef.current.multiple = false;
        }
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

      // TODO: Upload to S3 here for optimistic UI
      // uploadToS3(file).then(s3Url => {
      //   // Update attachment with S3 URL
      // }).catch(error => {
      //   toast.error('Failed to upload file');
      // });

      return {
        id: `draft_${id}`,
        kind,
        name: file.name,
        file,
        previewUrl,
        sizeLabel: formatBytes(file.size),
      } satisfies DraftAttachment;
    });

    // If it's image or video, show the full-screen composer
    if (kind === "image" || kind === "video") {
      setComposerAttachments(drafts);
      setShowMediaComposer(true);
    } else {
      setComposerAttachments((prev) => [...prev, ...drafts]);
    }

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

    const metadata =
      replyingMessage != null
        ? {
            replyTo: replyingMessage.id,
            replyPreview: replyingMessage.content,
            replyAuthor: replyingMessage.isInbound ? conversation.title : "You",
          }
        : undefined;

    // Send message with text only if no attachments
    if (composerAttachments.length === 0) {
      sendMessage(conversation.id, {
        content: draft.trim(),
        metadata,
      });
    } else {
      // Send one message per attachment (WhatsApp Web behavior)
      composerAttachments.forEach((attachment, index) => {
        const preparedAttachment = convertDraftToMessageAttachment(attachment);
        sendMessage(conversation.id, {
          content: index === 0 ? draft.trim() : "", // Only first message gets the text
          attachments: [preparedAttachment],
          metadata: index === 0 ? metadata : undefined, // Only first message gets reply metadata
        });
      });
    }

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context and analyser for volume visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setAudioVolume([]);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start volume monitoring
      const updateVolume = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedVolume = Math.min(100, (average / 128) * 100);

        setAudioVolume((prev) => {
          const newVolumes = [...prev, normalizedVolume];
          // Keep only last 40 values for visualization
          return newVolumes.slice(-40);
        });

        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      };

      updateVolume();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = (sendVoice: boolean) => {
    // Stop timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      if (sendVoice) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Create voice attachment and send
          const voiceAttachment: MessageAttachment = {
            id: `voice_${nanoid(6)}`,
            type: 'voice',
            name: `Voice message (${recordingDuration}s)`,
            previewUrl: audioUrl,
            sizeInBytes: audioBlob.size,
          };

          sendMessage(conversation.id, {
            content: "",
            attachments: [voiceAttachment],
          });

          toast.success(`Voice message sent (${recordingDuration}s)`);
        };
      }

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioVolume([]);
  };

  const hasUnread = conversation.unreadCount > 0;

  return (
    <div className="relative flex h-full flex-col">
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNumberModal(true);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              {selectedNumber}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => toast.info("Audio call feature coming soon")}
            title="Audio call"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => toast.info("Video call feature coming soon")}
            title="Video call"
          >
            <VideoIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => toast.info("Schedule call feature coming soon")}
            title="Schedule call"
          >
            <Clock className="h-5 w-5" />
          </Button>
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
      </div>

      <ScrollArea className="flex-1 bg-background px-6 py-4">
        <div className="space-y-3">
          {groupMessagesForDisplay(conversation.messages, currentUserId).map((group) => (
            <MessageGroup
              key={group.id}
              group={group}
              currentUserId={currentUserId}
              conversationId={conversation.id}
              conversationTitle={conversation.title}
              onDeleteMessage={handleDeleteMessage}
              onReply={handleReply}
              onCopyMessage={handleCopyMessage}
              onDownloadAttachments={handleDownloadAttachments}
              onStartEdit={handleStartEdit}
              toggleStarMessage={toggleStarMessage}
              togglePinMessage={togglePinMessage}
              toggleReaction={toggleReaction}
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

      {composerAttachments.length > 0 && !showMediaComposer && (
        <div className="space-y-2 border-t border-border bg-muted/40 px-4 py-3 max-h-[200px] overflow-y-auto">
          {composerAttachments.map((attachment) => (
            <AttachmentComposerPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => handleRemoveAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      {/* Voice Recording Overlay */}
      {isRecording && (
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 z-50">
          <div className="flex items-center gap-4">
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => stopRecording(false)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <div className="flex-1 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm font-medium">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 h-8 bg-muted rounded-full flex items-center px-3 gap-1">
                {audioVolume.map((volume, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, (volume / 100) * 28)}px` }}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="default"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => stopRecording(true)}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 border-t border-border bg-background px-4 py-3",
          isRecording && "opacity-0 pointer-events-none"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 p-2">
            <div className="grid grid-cols-3 gap-2">
              {ATTACHMENT_PICKER_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAttachmentPick(item.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition"
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white",
                      item.accent
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" type="button">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[350px] p-0 border">
            <Tabs defaultValue="emojis" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                <TabsTrigger value="emojis">Emojis</TabsTrigger>
                <TabsTrigger value="stickers">Stickers</TabsTrigger>
                <TabsTrigger value="gifs">GIFs</TabsTrigger>
              </TabsList>
              <TabsContent value="emojis" className="m-0">
                <EmojiPicker
                  onEmojiSelect={(emoji: string) => {
                    setDraft((prev) => prev + emoji);
                    setEmojiPickerOpen(false);
                  }}
                >
                  <EmojiPicker.Header>
                    <EmojiPicker.Input placeholder="Search emoji" />
                  </EmojiPicker.Header>
                  <EmojiPicker.Group>
                    <EmojiPicker.List />
                  </EmojiPicker.Group>
                </EmojiPicker>
              </TabsContent>
              <TabsContent value="stickers" className="m-0 p-4 text-center text-sm text-muted-foreground">
                Stickers coming soon
              </TabsContent>
              <TabsContent value="gifs" className="m-0 p-4 text-center text-sm text-muted-foreground">
                GIFs coming soon
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="flex-1 resize-none rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring max-h-[120px] min-h-[52px]"
          rows={2}
          placeholder={editingMessage ? "Edit message" : "Type a message"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
            }
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => handleFileSelection(event.target.files)}
        />
        {!isRecording && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            type="button"
            onClick={startRecording}
            title="Voice message"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Full-screen Media Composer Overlay */}
      {showMediaComposer && (
        <MediaComposerOverlay
          onClose={() => {
            setShowMediaComposer(false);
            setComposerAttachments([]);
          }}
          attachments={composerAttachments}
          onRemove={handleRemoveAttachment}
          onSend={(caption) => {
            // Send one message per attachment (5 images = 5 messages)
            composerAttachments.forEach((attachment, index) => {
              const preparedAttachment = convertDraftToMessageAttachment(attachment);
              sendMessage(conversation.id, {
                content: index === 0 ? caption : "", // Only first message gets the caption
                attachments: [preparedAttachment],
              });
            });
            setShowMediaComposer(false);
            setComposerAttachments([]);
          }}
        />
      )}

      {/* Number Selection Modal */}
      <Dialog open={showNumberModal} onOpenChange={setShowNumberModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Number</DialogTitle>
            <DialogDescription>Choose which number to use for this conversation</DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedNumber} onValueChange={setSelectedNumber} className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="+1 (555) 123-4567" id="num1" />
              <Label htmlFor="num1" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">+1 (555) 123-4567</div>
                <div className="text-xs text-muted-foreground">Primary Business Line</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="+1 (555) 987-6543" id="num2" />
              <Label htmlFor="num2" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">+1 (555) 987-6543</div>
                <div className="text-xs text-muted-foreground">Support Line</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="+1 (555) 111-2222" id="num3" />
              <Label htmlFor="num3" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">+1 (555) 111-2222</div>
                <div className="text-xs text-muted-foreground">Sales Line</div>
              </Label>
            </div>
          </RadioGroup>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNumberModal(false)}>Cancel</Button>
            <Button onClick={() => setShowNumberModal(false)}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Poll Dialog */}
      <PollDialog
        open={showPollDialog}
        onClose={() => setShowPollDialog(false)}
        onConfirm={(pollData) => {
          const pollAttachment: MessageAttachment = {
            id: `poll_${nanoid(6)}`,
            type: "poll",
            name: pollData.question,
            poll: pollData,
          };
          sendMessage(conversation.id, {
            content: "",
            attachments: [pollAttachment],
          });
          setShowPollDialog(false);
        }}
      />

      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        onConfirm={(eventData) => {
          const eventAttachment: MessageAttachment = {
            id: `event_${nanoid(6)}`,
            type: "event",
            name: eventData.title,
            event: eventData,
          };
          sendMessage(conversation.id, {
            content: "",
            attachments: [eventAttachment],
          });
          setShowEventDialog(false);
        }}
      />

      {/* Location Dialog */}
      <LocationDialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onConfirm={(locationData) => {
          const locationAttachment: MessageAttachment = {
            id: `location_${nanoid(6)}`,
            type: "location",
            name: "Pinned location",
            location: locationData,
          };
          sendMessage(conversation.id, {
            content: "",
            attachments: [locationAttachment],
          });
          setShowLocationDialog(false);
        }}
      />
    </div>
  );
}

type MessageGroup = {
  id: string;
  messages: Message[];
  isGrouped: boolean;
  senderId: string;
};

function groupMessagesForDisplay(messages: Message[], currentUserId: string): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentGroup: Message[] = [];
  let lastSenderId: string | null = null;

  messages.forEach((message, index) => {
    const hasAttachments = (message.attachments?.length ?? 0) > 0;
    const hasNoContent = !message.content || message.content.trim() === "";
    const isConsecutive = message.senderId === lastSenderId;
    const timeDiff = index > 0
      ? dayjs(message.createdAt).diff(dayjs(messages[index - 1].createdAt), 'second')
      : Infinity;

    // Group if: same sender, has attachments, no text content, sent within 30 seconds
    if (
      hasAttachments &&
      hasNoContent &&
      isConsecutive &&
      timeDiff < 30 &&
      currentGroup.length > 0
    ) {
      currentGroup.push(message);
    } else {
      // Flush current group if it exists
      if (currentGroup.length > 0) {
        groups.push({
          id: currentGroup[0].id,
          messages: currentGroup,
          isGrouped: currentGroup.length > 1,
          senderId: currentGroup[0].senderId,
        });
        currentGroup = [];
      }

      // Start new group or add as single message
      if (hasAttachments && hasNoContent) {
        currentGroup = [message];
        lastSenderId = message.senderId;
      } else {
        groups.push({
          id: message.id,
          messages: [message],
          isGrouped: false,
          senderId: message.senderId,
        });
        lastSenderId = message.senderId;
      }
    }
  });

  // Flush any remaining group
  if (currentGroup.length > 0) {
    groups.push({
      id: currentGroup[0].id,
      messages: currentGroup,
      isGrouped: currentGroup.length > 1,
      senderId: currentGroup[0].senderId,
    });
  }

  return groups;
}

type MessageGroupProps = {
  group: MessageGroup;
  currentUserId: string;
  conversationId: string;
  conversationTitle: string;
  onDeleteMessage: (messageId: string) => void;
  onReply: (message: Message) => void;
  onCopyMessage: (message: Message) => void;
  onDownloadAttachments: (message: Message) => void;
  onStartEdit: (message: Message) => void;
  toggleStarMessage: (conversationId: string, messageId: string) => void;
  togglePinMessage: (conversationId: string, messageId: string) => void;
  toggleReaction: (conversationId: string, messageId: string, emoji: string, userId: string) => void;
};

function MessageGroup({
  group,
  currentUserId,
  conversationId,
  conversationTitle,
  onDeleteMessage,
  onReply,
  onCopyMessage,
  onDownloadAttachments,
  onStartEdit,
  toggleStarMessage,
  togglePinMessage,
  toggleReaction,
}: MessageGroupProps) {
  const isOwn = group.senderId === currentUserId;

  // If grouped, render all attachments in one bubble
  if (group.isGrouped) {
    const allAttachments = group.messages.flatMap(m => m.attachments ?? []);
    const firstMessage = group.messages[0];

    return (
      <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
        <div className="relative max-w-[70%] rounded-2xl shadow-sm px-1.5 py-1.5 bg-secondary">
          {/* Render all attachments in a grid */}
          <div className={cn(
            "grid gap-1",
            allAttachments.length === 1 && "grid-cols-1",
            allAttachments.length === 2 && "grid-cols-2",
            allAttachments.length >= 3 && "grid-cols-2"
          )}>
            {allAttachments.map((attachment) => (
              <AttachmentBubblePreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-end gap-2 px-1.5 pb-0.5 text-[11px] text-muted-foreground">
            <span>{dayjs(firstMessage.createdAt).format("HH:mm")}</span>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render individual message bubbles
  return (
    <>
      {group.messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={isOwn}
          onDelete={() => onDeleteMessage(message.id)}
          onReply={() => onReply(message)}
          onForward={() => toast.info("Forward coming soon")}
          onFavorite={() => toggleStarMessage(conversationId, message.id)}
          onInfo={() => toast.info("Message info coming soon")}
          onCopy={() => onCopyMessage(message)}
          onDownload={() => onDownloadAttachments(message)}
          onPin={() => togglePinMessage(conversationId, message.id)}
          onReport={() => toast.success("Message reported")}
          onEdit={() => onStartEdit(message)}
          onReact={(emoji) => toggleReaction(conversationId, message.id, emoji, currentUserId)}
        />
      ))}
    </>
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
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const timestamp = dayjs(message.createdAt).format("HH:mm");
  const canEdit =
    isOwn &&
    dayjs(message.createdAt).isAfter(dayjs().subtract(15, "minute")) &&
    (message.attachments?.length ?? 0) === 0;
  const reactionMap = groupReactions(message.reactions);

  // Check if message is emoji-only (no attachments, only emojis)
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+$/u;
  const isEmojiOnly = !message.attachments?.length && message.content && emojiRegex.test(message.content.trim());
  const emojiCount = isEmojiOnly ? [...message.content.trim()].filter(char => emojiRegex.test(char)).length : 0;

  // 1 emoji = no bubble, 2+ = with bubble (as per WhatsApp Web behavior)
  const showBubbleForEmoji = isEmojiOnly && emojiCount >= 2;
  const showNoBubble = isEmojiOnly && emojiCount === 1;

  // Determine emoji size based on count
  let emojiSize = "";
  if (isEmojiOnly) {
    if (emojiCount === 1) {
      emojiSize = "text-7xl"; // Large single emoji, no bubble
    } else if (emojiCount <= 2) {
      emojiSize = "text-5xl"; // Medium for 2 emojis, with bubble
    } else if (emojiCount <= 4) {
      emojiSize = "text-4xl"; // Smaller for 3-4 emojis, with bubble
    }
  }

  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "relative max-w-[70%]",
              // Show bubble for non-emoji messages OR for 2+ emojis
              (showBubbleForEmoji || !isEmojiOnly) && "rounded-2xl shadow-sm",
              // No bubble for single emoji
              !showNoBubble && !hasAttachments && "px-3 py-2",
              !showNoBubble && hasAttachments && "px-1.5 py-1.5", // Reduced padding for attachments
              // Apply background only if we're showing a bubble
              (showBubbleForEmoji || !isEmojiOnly) && (isOwn ? "bg-secondary text-secondary-foreground" : "bg-muted")
            )}
          >
            {message.isPinned && (
              <div className="absolute -top-4 right-2 flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
                <Pin className="h-3 w-3" /> Pinned
              </div>
            )}
            {message.metadata && (message.metadata as Record<string, string>).replyPreview && (
              <div className={cn("rounded-lg border border-border/60 bg-background/70 p-2 text-xs", hasAttachments ? "mb-1.5" : "mb-2")}>
                <p className="font-medium">
                  {(message.metadata as Record<string, string>).replyAuthor ?? "Unknown"}
                </p>
                <p className="line-clamp-2 text-muted-foreground">
                  {(message.metadata as Record<string, string>).replyPreview}
                </p>
              </div>
            )}
            {hasAttachments && (
              <div className={cn(message.content ? "mb-1" : "")}>
                {message.attachments!.map((attachment) => (
                  <AttachmentBubblePreview key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}
            {message.content && (
              <p className={cn(
                "whitespace-pre-wrap leading-relaxed",
                isEmojiOnly ? emojiSize : "text-sm",
                hasAttachments && "px-1.5"
              )}>
                {message.content}
              </p>
            )}
            {!showNoBubble && (
              <div className={cn(
                "mt-1 flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted-foreground",
                hasAttachments && "px-1.5 pb-0.5"
              )}>
                {message.isStarred && <Star className="h-3 w-3" />}
                {message.editedAt && <span>Edited</span>}
                <span>{timestamp}</span>
              </div>
            )}
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
          <ContextMenuItem onSelect={() => setReactionPickerOpen(true)}>
            <Smile className="mr-2 h-4 w-4" /> React
          </ContextMenuItem>
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

      {/* Reaction Emoji Picker */}
      <Popover open={reactionPickerOpen} onOpenChange={setReactionPickerOpen}>
        <PopoverContent className="w-[350px] p-0 border">
          <Tabs defaultValue="emojis" className="w-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
              <TabsTrigger value="emojis">Emojis</TabsTrigger>
              <TabsTrigger value="stickers">Stickers</TabsTrigger>
              <TabsTrigger value="gifs">GIFs</TabsTrigger>
            </TabsList>
            <TabsContent value="emojis" className="m-0">
              <EmojiPicker
                onEmojiSelect={(emoji: string) => {
                  onReact(emoji);
                  setReactionPickerOpen(false);
                }}
              >
                <EmojiPicker.Header>
                  <EmojiPicker.Input placeholder="Search emoji" />
                </EmojiPicker.Header>
                <EmojiPicker.Group>
                  <EmojiPicker.List />
                </EmojiPicker.Group>
              </EmojiPicker>
            </TabsContent>
            <TabsContent value="stickers" className="m-0 p-4 text-center text-sm text-muted-foreground">
              Stickers coming soon
            </TabsContent>
            <TabsContent value="gifs" className="m-0 p-4 text-center text-sm text-muted-foreground">
              GIFs coming soon
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type MediaComposerOverlayProps = {
  onClose: () => void;
  attachments: DraftAttachment[];
  onRemove: (id: string) => void;
  onSend: (caption: string) => void;
};

function MediaComposerOverlay({ onClose, attachments, onRemove, onSend }: MediaComposerOverlayProps) {
  const [caption, setCaption] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSend = () => {
    onSend(caption);
    setCaption("");
    setActiveIndex(0);
  };

  const activeAttachment = attachments[activeIndex];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
              <div>
                <p className="font-semibold text-base">
                  {attachments.length} {attachments.length === 1 ? 'file' : 'files'} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeIndex + 1} of {attachments.length}
                </p>
              </div>
            </div>
            <Button onClick={handleSend} size="lg" className="gap-2">
              <Send className="h-4 w-4" />
              Send {attachments.length > 1 ? `${attachments.length} messages` : 'message'}
            </Button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-black/95 flex items-center justify-center p-8 relative overflow-hidden">
            {activeAttachment && (
              <>
                {activeAttachment.kind === "image" && activeAttachment.previewUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeAttachment.previewUrl}
                    alt={activeAttachment.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                )}
                {activeAttachment.kind === "video" && activeAttachment.previewUrl && (
                  <video
                    src={activeAttachment.previewUrl}
                    controls
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                  />
                )}
              </>
            )}

            {/* Navigation arrows */}
            {attachments.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 shadow-lg hover:scale-110 transition-transform"
                  onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1))}
                >
                  <ChevronRight className="h-6 w-6 rotate-180" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 shadow-lg hover:scale-110 transition-transform"
                  onClick={() => setActiveIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0))}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Edit tools */}
            <div className="absolute top-6 right-6 flex gap-3">
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 shadow-lg" title="Crop">
                <Scissors className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 shadow-lg" title="Rotate">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* File name display */}
            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">{activeAttachment.name}</p>
            </div>
          </div>

          {/* Thumbnail strip */}
          {attachments.length > 1 && (
            <div className="border-t bg-background px-6 py-4">
              <ScrollArea className="w-full">
                <div className="flex gap-3">
                  {attachments.map((attachment, idx) => (
                    <div key={attachment.id} className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={cn(
                          "relative h-20 w-20 rounded-xl overflow-hidden border-2 transition-all hover:scale-105",
                          activeIndex === idx ? "border-primary shadow-lg scale-105" : "border-border/50"
                        )}
                      >
                        {attachment.kind === "image" && attachment.previewUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={attachment.previewUrl} alt="" className="w-full h-full object-cover" />
                        )}
                        {attachment.kind === "video" && (
                          <div className="w-full h-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <VideoIcon className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(attachment.id);
                          if (activeIndex >= attachments.length - 1) {
                            setActiveIndex(Math.max(0, attachments.length - 2));
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Caption input */}
          <div className="border-t px-6 py-4 bg-background">
            <div className="flex items-center gap-3">
              <Smile className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Textarea
                placeholder="Add a caption... (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none flex-1 min-h-[60px] text-sm"
                rows={2}
              />
            </div>
          </div>
    </div>
  );
}

type PollDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { question: string; options: Array<{ id: string; label: string }>; allowsMultiple: boolean }) => void;
};

function PollDialog({ open, onClose, onConfirm }: PollDialogProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowsMultiple, setAllowsMultiple] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleConfirm = () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) {
      toast.error("Please provide a question and at least 2 options");
      return;
    }

    onConfirm({
      question: question.trim(),
      options: options
        .filter(o => o.trim())
        .map((label, idx) => ({ id: `opt_${idx}`, label: label.trim() })),
      allowsMultiple,
    });

    // Reset
    setQuestion("");
    setOptions(["", ""]);
    setAllowsMultiple(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
          <DialogDescription>Ask a question and provide options</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What's your question?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiple"
              checked={allowsMultiple}
              onCheckedChange={(checked) => setAllowsMultiple(checked as boolean)}
            />
            <Label htmlFor="multiple" className="text-sm cursor-pointer">
              Allow multiple answers
            </Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Create Poll</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type EventDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { title: string; date: string; location?: string }) => void;
};

function EventDialog({ open, onClose, onConfirm }: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const handleConfirm = () => {
    if (!title.trim() || !date) {
      toast.error("Please provide event title and date");
      return;
    }

    const dateTime = time ? `${date}T${time}` : `${date}T12:00`;

    onConfirm({
      title: title.trim(),
      date: new Date(dateTime).toISOString(),
      location: location.trim() || undefined,
    });

    // Reset
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>Schedule a meeting or event</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Team Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              placeholder="Conference Room A or Zoom link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Create Event</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type LocationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { title: string; subtitle: string; latitude?: number; longitude?: number }) => void;
};

function LocationDialog({ open, onClose, onConfirm }: LocationDialogProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  const handleConfirm = () => {
    if (!title.trim()) {
      toast.error("Please provide a location name");
      return;
    }

    onConfirm({
      title: title.trim(),
      subtitle: subtitle.trim() || "Location",
    });

    // Reset
    setTitle("");
    setSubtitle("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Location</DialogTitle>
          <DialogDescription>Choose a location to share</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="locationTitle">Location Name</Label>
            <Input
              id="locationTitle"
              placeholder="Robocall HQ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="locationSubtitle">Address</Label>
            <Input
              id="locationSubtitle"
              placeholder="123 Queen Street"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Share Location</Button>
        </div>
      </DialogContent>
    </Dialog>
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
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 p-2">
            {attachment.previewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={attachment.previewUrl} alt={attachment.name} className="h-12 w-12 object-cover rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              {attachment.sizeLabel && <p className="text-xs text-muted-foreground">{attachment.sizeLabel}</p>}
            </div>
          </div>
        );
      case "video":
        return (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 p-2">
            <div className="h-12 w-12 bg-black/10 rounded-lg flex items-center justify-center">
              <VideoIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              {attachment.sizeLabel && <p className="text-xs text-muted-foreground">{attachment.sizeLabel}</p>}
            </div>
          </div>
        );
      case "audio":
      case "voice":
        return (
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <div className="flex items-center gap-3">
              <Music2 className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium flex-1 truncate">{attachment.name}</p>
            </div>
          </div>
        );
      case "document":
        return (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 p-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              {attachment.sizeLabel && <p className="text-xs text-muted-foreground">{attachment.sizeLabel}</p>}
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <div className="flex items-center gap-3">
              <User2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {(attachment.metadata?.contact as { name?: string })?.name ?? attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.metadata?.contact as { phone?: string })?.phone ?? "+1 (555) 010-2020"}
                </p>
              </div>
            </div>
          </div>
        );
      case "location":
        return (
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {(attachment.metadata?.location as { title?: string })?.title ?? attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.metadata?.location as { subtitle?: string })?.subtitle ?? "Shared location"}
                </p>
              </div>
            </div>
          </div>
        );
      case "poll":
        return (
          <div className="rounded-xl border border-border bg-background/80 p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {(attachment.metadata?.poll as { question?: string })?.question ?? attachment.name}
              </p>
            </div>
            <div className="space-y-1">
              {((attachment.metadata?.poll as { options?: Array<{ id: string; label: string }> })
                ?.options ?? []
              ).map((option) => (
                <div key={option.id} className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
                  • {option.label}
                </div>
              ))}
            </div>
          </div>
        );
      case "event":
        return (
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {(attachment.metadata?.event as { title?: string })?.title ?? attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayjs((attachment.metadata?.event as { date?: string })?.date ?? new Date().toISOString()).format(
                    "MMM D, h:mm A"
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      case "link":
        return (
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {(attachment.metadata?.link as { title?: string })?.title ?? attachment.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {(attachment.metadata?.link as { url?: string })?.url ?? "https://example.com"}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="rounded-xl border border-border bg-background/80 p-2 text-xs text-muted-foreground">
            Attachment ready to send.
          </div>
        );
    }
  };

  return (
    <div className="group relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition z-10"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
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
        <div className="overflow-hidden rounded-lg bg-muted/20 max-w-sm">
          {attachment.previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.previewUrl} alt={attachment.name} className="w-full object-cover max-h-80" />
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
        <div className="overflow-hidden rounded-lg bg-muted/20 max-w-sm relative">
          {attachment.previewUrl ? (
            <>
              <video src={attachment.previewUrl} className="w-full max-h-80" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-background/90 flex items-center justify-center">
                  <VideoIcon className="h-6 w-6 text-primary ml-0.5" />
                </div>
              </div>
            </>
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
        <div className="rounded-lg bg-muted/40 px-3 py-2 min-w-[280px] flex items-center gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition"
          >
            <Music2 className="h-4 w-4 text-primary" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className="h-8 flex-1 flex items-center bg-primary/10 rounded-full px-2">
              <div className="h-1 bg-primary/40 rounded-full w-2/5" />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">0:42</span>
          </div>
        </div>
      );
    case "document":
      return (
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-2 min-w-[200px]">
          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            {attachment.sizeInBytes && (
              <p className="text-xs text-muted-foreground">{formatBytes(attachment.sizeInBytes)}</p>
            )}
          </div>
          <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      );
    case "contact":
      return (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm min-w-[180px]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{attachment.contact?.name ?? attachment.name}</p>
              <p className="text-xs text-muted-foreground">{attachment.contact?.phone ?? "+1 (555) 010-2020"}</p>
            </div>
          </div>
        </div>
      );
    case "location":
      return (
        <div className="overflow-hidden rounded-lg max-w-xs">
          <div className="h-24 bg-gradient-to-br from-emerald-500/30 to-emerald-700/40 relative flex items-center justify-center">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div className="px-3 py-2 bg-muted/40">
            <p className="font-medium text-sm">{attachment.location?.title ?? attachment.name}</p>
            <p className="text-xs text-muted-foreground">{attachment.location?.subtitle ?? "Shared location"}</p>
          </div>
        </div>
      );
    case "poll":
      return (
        <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm min-w-[260px] max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-primary" />
            <p className="font-medium">{attachment.poll?.question ?? attachment.name}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Select one or more</p>
          <div className="space-y-2">
            {(attachment.poll?.options ?? []).map((option) => (
              <button
                key={option.id}
                type="button"
                className="w-full text-left rounded-md bg-background/50 px-3 py-2 hover:bg-background/80 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50 flex-shrink-0" />
                  <span className="text-sm">{option.label}</span>
                </div>
                {option.votes !== undefined && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">{option.votes}</span>
                )}
              </button>
            ))}
          </div>
          <button className="mt-3 text-xs text-primary hover:underline">
            View votes
          </button>
        </div>
      );
    case "event":
      return (
        <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm min-w-[220px] max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">{attachment.event?.title ?? attachment.name}</p>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p className="font-medium">
                  {dayjs(attachment.event?.date ?? new Date().toISOString()).format("dddd, MMMM D, YYYY")}
                </p>
                <p>
                  {dayjs(attachment.event?.date ?? new Date().toISOString()).format("h:mm A")}
                </p>
                {attachment.event?.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    <p>{attachment.event.location}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">1</AvatarFallback>
                </Avatar>
                <span>1 going</span>
              </div>
            </div>
          </div>
          <button className="mt-3 w-full text-center text-sm text-primary hover:underline">
            Edit event
          </button>
        </div>
      );
    case "link":
      return (
        <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm min-w-[200px] max-w-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate mb-0.5">{attachment.link?.title ?? attachment.name}</p>
              {attachment.link?.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground mb-1">
                  {attachment.link.description}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground truncate">{attachment.link?.url}</p>
            </div>
          </div>
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
