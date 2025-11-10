"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowLeft,
  Bell,
  HelpCircle,
  Lock,
  MessageCircle,
  Settings,
  Shield,
  Smartphone,
  User,
  UserCheck,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPlatformMeta } from "@/lib/platforms";
import { useChatStore } from "@/lib/state/use-chat-store";
import type { PlatformConnection } from "@/lib/types/chat";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

const SETTING_ITEMS = [
  { id: "account", title: "Account", description: "Security, number, account info", icon: Shield },
  { id: "privacy", title: "Privacy", description: "Visibility, blocked contacts", icon: Lock },
  { id: "chats", title: "Chats", description: "Theme, media, chat backup", icon: MessageCircle },
  { id: "notifications", title: "Notifications", description: "Alerts and sounds", icon: Bell },
  { id: "devices", title: "Linked devices", description: "Manage active sessions", icon: Smartphone },
  { id: "help", title: "Help", description: "Support, policies", icon: User },
] as const;

type SettingId = (typeof SETTING_ITEMS)[number]["id"];

export function SettingsTab() {
  const { teamMembers, connections } = useChatStore();
  const owner = teamMembers.find((member) => member.role === "owner") ?? teamMembers[0];
  const ownerInitials = owner?.name?.slice(0, 2).toUpperCase() ?? "RC";
  const ownerPhoneNumber = "+92 306 4547910";
  const [activeItemId, setActiveItemId] = useState<SettingId | null>(null);
  const [messagePreview, setMessagePreview] = useState(true);
  const [incomingSound, setIncomingSound] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true);
  const [archiveChats, setArchiveChats] = useState(false);
  const [busyHoursMute, setBusyHoursMute] = useState(false);
  const [linkedStatusSync, setLinkedStatusSync] = useState(true);
  const [lastSeen, setLastSeen] = useState("contacts");
  const [profilePhotoVisibility, setProfilePhotoVisibility] = useState("everyone");
  const [statusVisibility, setStatusVisibility] = useState("contacts");
  const [defaultDisappearTimer, setDefaultDisappearTimer] = useState("off");
  const [themePreference, setThemePreference] = useState("light");

  const activeItem = activeItemId
    ? SETTING_ITEMS.find((item) => item.id === activeItemId) ?? null
    : null;

  const connectedDevices = useMemo(
    () => connections.filter((connection) => connection.status === "connected"),
    [connections]
  );

  const renderSettingsContent = (section: SettingId) => {
    switch (section) {
      case "account":
        return (
          <div className="space-y-3">
            <div className="rounded-md border bg-card p-4">
              <p className="text-xs text-muted-foreground">Phone number</p>
              <p className="font-medium">{ownerPhoneNumber}</p>
              <p className="text-xs text-muted-foreground">
                Used for sign-in and two-step verification.
              </p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Account security</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="font-medium leading-tight">Security notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Alert me if this number is registered elsewhere.
                  </p>
                </div>
                <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Shield className="h-4 w-4" />
              Request account info
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-destructive">
              <Lock className="h-4 w-4" />
              Delete my account
            </Button>
          </div>
        );
      case "privacy":
        return (
          <div className="space-y-3">
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Last seen &amp; online</p>
              <Select value={lastSeen} onValueChange={setLastSeen}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Profile photo</p>
              <Select value={profilePhotoVisibility} onValueChange={setProfilePhotoVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Status updates</p>
              <Select value={statusVisibility} onValueChange={setStatusVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">My contacts</SelectItem>
                  <SelectItem value="custom">Only share with...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Default message timer</p>
              <Select value={defaultDisappearTimer} onValueChange={setDefaultDisappearTimer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Read receipts</p>
                <p className="text-xs text-muted-foreground">
                  If turned off, you won&apos;t send or receive receipts.
                </p>
              </div>
              <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
            </div>
            <Button variant="outline" className="w-full justify-start gap-2">
              <UserCheck className="h-4 w-4" />
              Blocked contacts
            </Button>
          </div>
        );
      case "chats":
        return (
          <div className="space-y-3">
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">App theme</p>
              <Select value={themePreference} onValueChange={setThemePreference}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Media visibility</p>
                <p className="text-xs text-muted-foreground">Show new media in gallery</p>
              </div>
              <Switch checked={autoDownloadMedia} onCheckedChange={setAutoDownloadMedia} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Archive chats</p>
                <p className="text-xs text-muted-foreground">Keep chats archived when new messages arrive</p>
              </div>
              <Switch checked={archiveChats} onCheckedChange={setArchiveChats} />
            </div>
            <Button variant="outline" className="w-full justify-start gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat backup
            </Button>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Desktop alerts</p>
                <p className="text-xs text-muted-foreground">Keep app open to receive alerts</p>
              </div>
              <Switch checked={desktopAlerts} onCheckedChange={setDesktopAlerts} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Show previews</p>
                <p className="text-xs text-muted-foreground">Display sender and message snippet</p>
              </div>
              <Switch checked={messagePreview} onCheckedChange={setMessagePreview} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Sounds</p>
                <p className="text-xs text-muted-foreground">Play tone for new messages</p>
              </div>
              <Switch checked={incomingSound} onCheckedChange={setIncomingSound} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Mute busy hours</p>
                <p className="text-xs text-muted-foreground">Silence alerts between 10pm - 7am</p>
              </div>
              <Switch checked={busyHoursMute} onCheckedChange={setBusyHoursMute} />
            </div>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Bell className="h-4 w-4" />
              Advanced notification settings
            </Button>
          </div>
        );
      case "devices":
        return (
          <div className="space-y-3">
            {connectedDevices.map((device: PlatformConnection) => {
              const meta = getPlatformMeta(device.platform);
              return (
                <div key={device.id} className="rounded-md border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{meta.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.accountName ?? "No account label"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {device.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Synced {device.lastSyncedAt ? dayjs(device.lastSyncedAt).fromNow() : "just now"}
                  </p>
                </div>
              );
            })}
            {connectedDevices.length === 0 && (
              <div className="rounded-md border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground">
                No active devices. Use the button below to link your first one.
              </div>
            )}
            <div className="rounded-md border bg-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium leading-tight">Keep me signed in</p>
                  <p className="text-xs text-muted-foreground">
                    Maintain secure sessions on trusted devices.
                  </p>
                </div>
                <Switch checked={linkedStatusSync} onCheckedChange={setLinkedStatusSync} />
              </div>
            </div>
            <Button className="w-full justify-center gap-2">
              <Smartphone className="h-4 w-4" />
              Link new device
            </Button>
          </div>
        );
      case "help":
        return (
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <HelpCircle className="h-4 w-4" />
              Help Center
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              Contact support
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Lock className="h-4 w-4" />
              Privacy &amp; terms
            </Button>
            <div className="rounded-md border bg-card p-4 text-xs text-muted-foreground">
              App version 1.0.0-beta
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen text-sm">
      <aside className="relative flex w-[360px] flex-col border-r border-border bg-background">
        <div className="space-y-3 border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Input placeholder="Search settings" className="h-9 bg-muted" />
        </div>
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{ownerInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-tight">{owner?.name ?? "Robocall Operator"}</p>
              <p className="text-xs text-muted-foreground">Hey there! I am using WhatsApp.</p>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {SETTING_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveItemId(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left transition",
                    isActive && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        {activeItem && (
          <div className="absolute inset-0 z-10 flex flex-col bg-background">
            <div className="flex items-center gap-3 border-b border-border px-3 py-3">
              <Button variant="ghost" size="icon" onClick={() => setActiveItemId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-base font-semibold">{activeItem.title}</p>
                <p className="text-xs text-muted-foreground">{activeItem.description}</p>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 px-4 py-4">{renderSettingsContent(activeItem.id)}</div>
            </ScrollArea>
          </div>
        )}
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground">
        <Settings className="h-12 w-12" />
        <p className="text-lg font-semibold">Settings</p>
        <p className="text-xs">Manage preferences using the panel on the left.</p>
      </section>
    </div>
  );
}
