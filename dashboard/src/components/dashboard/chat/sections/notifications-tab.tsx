"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Bell, BellOff, Inbox, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "@/lib/state/use-chat-store";

dayjs.extend(relativeTime);

export function NotificationsTab() {
  const {
    notifications,
    updateNotificationStatus,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useChatStore();

  const [mutedSounds, setMutedSounds] = useState(false);
  const [mutedPreviews, setMutedPreviews] = useState(false);

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <Button variant="ghost" size="sm" className="gap-2" onClick={markAllNotificationsAsRead}>
            <Bell className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
        <div className="space-y-3 border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Message previews</p>
              <p className="text-xs text-muted-foreground">Show snippets in desktop alerts</p>
            </div>
            <Switch checked={!mutedPreviews} onCheckedChange={(checked) => setMutedPreviews(!checked)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notification sounds</p>
              <p className="text-xs text-muted-foreground">Play tones for incoming messages</p>
            </div>
            <Switch checked={!mutedSounds} onCheckedChange={(checked) => setMutedSounds(!checked)} />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {notifications.map((notification) => (
              <ContextMenu key={notification.id}>
                <ContextMenuTrigger asChild>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1 text-[10px] uppercase">
                        <Inbox className="h-3 w-3" />
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {dayjs(notification.createdAt).fromNow()}
                    </p>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onSelect={() =>
                      updateNotificationStatus(
                        notification.id,
                        notification.status === "read" ? "unread" : "read"
                      )
                    }
                  >
                    {notification.status === "read" ? "Mark as unread" : "Mark as read"}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      updateNotificationStatus(
                        notification.id,
                        notification.status === "archived" ? "unread" : "archived"
                      )
                    }
                  >
                    {notification.status === "archived" ? "Restore" : "Archive"}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="text-destructive" onSelect={() => deleteNotification(notification.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete notification
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            {notifications.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <BellOff className="h-5 w-5" />
                <p>No notifications yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground">
        <Bell className="h-12 w-12" />
        <p className="text-lg font-semibold">Notifications</p>
        <p className="text-xs">Alerts appear here when configured on the left.</p>
      </section>
    </div>
  );
}
