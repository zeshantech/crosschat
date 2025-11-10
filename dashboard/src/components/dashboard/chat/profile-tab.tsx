"use client";

import dayjs from "dayjs";
import { useState } from "react";
import {
  ArrowLeft,
  LogOut,
  Palette,
  Phone,
  Shield,
  User,
  UserCircle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useChatStore } from "@/lib/state/use-chat-store";
import { cn } from "@/lib/utils";

const PROFILE_ITEMS = [
  { id: "profile", title: "Profile", description: "Name, about, phone", icon: User },
  { id: "security", title: "Security", description: "Two-step verification", icon: Shield },
  { id: "appearance", title: "Appearance", description: "Theme and wallpaper", icon: UserCircle },
] as const;

type ProfileSectionId = (typeof PROFILE_ITEMS)[number]["id"];

export function ProfileTab() {
  const { teamMembers } = useChatStore();
  const owner = teamMembers.find((member) => member.role === "owner") ?? teamMembers[0];
  const [activeSectionId, setActiveSectionId] = useState<ProfileSectionId | null>(null);
  const [displayName, setDisplayName] = useState(owner?.name ?? "Robocall Operator");
  const [statusText, setStatusText] = useState("Building delightful multi-channel support.");
  const [twoStep, setTwoStep] = useState(true);
  const [deviceLock, setDeviceLock] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [themeChoice, setThemeChoice] = useState("system");
  const [fontScale, setFontScale] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState(true);
  const ownerInitials = owner?.name?.slice(0, 2).toUpperCase() ?? "RC";
  const activeSection = activeSectionId
    ? PROFILE_ITEMS.find((item) => item.id === activeSectionId) ?? null
    : null;

  const renderSection = (sectionId: ProfileSectionId) => {
    switch (sectionId) {
      case "profile":
        return (
          <div className="space-y-3">
            <div className="rounded-md border bg-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Display name</p>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </div>
            <div className="rounded-md border bg-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground">About</p>
              <Input value={statusText} onChange={(event) => setStatusText(event.target.value)} />
            </div>
            <div className="rounded-md border bg-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>+92 306 4547910</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Linked on {owner?.lastActiveAt ? dayjs(owner.lastActiveAt).format("D MMM YYYY") : "N/A"}
              </p>
            </div>
            <Button className="w-full justify-center gap-2">
              <User className="h-4 w-4" />
              Save profile
            </Button>
            <Button variant="destructive" className="w-full justify-center gap-2">
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        );
      case "security":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Two-step verification</p>
                <p className="text-xs text-muted-foreground">
                  Protect your account with a PIN when registering.
                </p>
              </div>
              <Switch checked={twoStep} onCheckedChange={setTwoStep} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Device lock</p>
                <p className="text-xs text-muted-foreground">
                  Require biometrics when opening on this computer.
                </p>
              </div>
              <Switch checked={deviceLock} onCheckedChange={setDeviceLock} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Login alerts</p>
                <p className="text-xs text-muted-foreground">Notify me when my profile signs in</p>
              </div>
              <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
            </div>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Shield className="h-4 w-4" />
              Review active sessions
            </Button>
          </div>
        );
      case "appearance":
        return (
          <div className="space-y-3">
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Theme</p>
              <Select value={themeChoice} onValueChange={setThemeChoice}>
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
            <div className="space-y-2 rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">Font size</p>
              <Select value={fontScale} onValueChange={setFontScale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Compact mode</p>
                <p className="text-xs text-muted-foreground">Reduce spacing in message list</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">Media previews</p>
                <p className="text-xs text-muted-foreground">Show photos and videos inline</p>
              </div>
              <Switch checked={mediaPreviews} onCheckedChange={setMediaPreviews} />
            </div>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Palette className="h-4 w-4" />
              Chat wallpaper
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen text-sm">
      <aside className="relative flex w-[360px] flex-col border-r border-border bg-background">
        <div className="border-b border-border px-4 py-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{ownerInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{owner?.name ?? "Robocall Operator"}</p>
              <p className="text-xs text-muted-foreground">Hey there! I am using WhatsApp.</p>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {PROFILE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSectionId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSectionId(item.id)}
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
        {activeSection && (
          <div className="absolute inset-0 z-10 flex flex-col bg-background">
            <div className="flex items-center gap-3 border-b border-border px-3 py-3">
              <Button variant="ghost" size="icon" onClick={() => setActiveSectionId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-base font-semibold">{activeSection.title}</p>
                <p className="text-xs text-muted-foreground">{activeSection.description}</p>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 px-4 py-4">{renderSection(activeSection.id)}</div>
            </ScrollArea>
          </div>
        )}
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground">
        <UserCircle className="h-12 w-12" />
        <p className="text-lg font-semibold">Profile</p>
        <p className="text-xs">Manage identity using the list on the left.</p>
      </section>
    </div>
  );
}
