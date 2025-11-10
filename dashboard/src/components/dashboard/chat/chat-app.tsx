"use client";

import {
  BarChart3,
  Bell,
  MessageCircle,
  Plug,
  Settings,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/state/use-chat-store";

import { ProfileTab } from "./profile-tab";
import { RolesTab } from "./roles-tab";
import { SettingsTab } from "./settings-panel";
import { AnalyticsTab } from "./sections/analytics-tab";
import { ConnectTab } from "./sections/connect-tab";
import { InboxView } from "./sections/inbox-tab";
import { MembersTab } from "./sections/members-tab";
import { NotificationsTab } from "./sections/notifications-tab";
import { TagsTab } from "./sections/tags-tab";

const PRIMARY_TABS = [
  { id: "inbox" as const, icon: MessageCircle, label: "Chats" },
  { id: "notifications" as const, icon: Bell, label: "Notifications" },
  { id: "connect" as const, icon: Plug, label: "Connections" },
  { id: "members" as const, icon: Users, label: "Team" },
  { id: "tags" as const, icon: Tag, label: "Labels" },
  { id: "analytics" as const, icon: BarChart3, label: "Analytics" },
  { id: "roles" as const, icon: ShieldCheck, label: "Roles" },
];

export function ChatAppShell() {
  const { activeTab, setActiveTab, teamMembers } = useChatStore();
  const owner = teamMembers.find((member) => member.role === "owner") ?? teamMembers[0];

  const renderPanel = () => {
    switch (activeTab) {
      case "notifications":
        return <NotificationsTab />;
      case "connect":
        return <ConnectTab />;
      case "members":
        return <MembersTab />;
      case "tags":
        return <TagsTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "settings":
        return <SettingsTab />;
      case "roles":
        return <RolesTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <InboxView />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <nav className="flex w-16 flex-col items-center justify-between border-r border-border bg-muted/40 py-4">
        <div className="flex flex-col items-center gap-2">
          {PRIMARY_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition",
                      isActive && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition",
                  activeTab === "settings" && "bg-secondary text-secondary-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition",
                  activeTab === "profile" && "ring-2 ring-secondary"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{owner?.name?.slice(0, 2).toUpperCase() ?? "RC"}</AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Profile</TooltipContent>
          </Tooltip>
        </div>
      </nav>
      <div className="flex-1">{renderPanel()}</div>
    </div>
  );
}
