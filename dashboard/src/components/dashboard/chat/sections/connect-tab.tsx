"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Plug2, Trash2 } from "lucide-react";

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
import { PLATFORM_META, getPlatformMeta } from "@/lib/platforms";
import { useChatStore } from "@/lib/state/use-chat-store";
import type { MessagingPlatform } from "@/lib/types/chat";
import { toast } from "sonner";

dayjs.extend(relativeTime);

const connectables: MessagingPlatform[] = [
  "whatsapp",
  "instagram",
  "slack",
  "telegram",
  "email",
  "messenger",
];

export function ConnectTab() {
  const { connections, updateConnectionStatus, addConnection, removeConnection } = useChatStore();

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border bg-background">
        <div className="space-y-3 border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Linked devices</h2>
          <p className="text-xs text-muted-foreground">
            Connect messaging platforms for unified inbox routing.
          </p>
          <div className="flex flex-wrap gap-2">
            {connectables.map((platform) => {
              const meta = PLATFORM_META[platform];
              return (
                <Button
                  key={platform}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => addConnection(platform)}
                >
                  <meta.icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 px-2 py-3">
            {connections.map((connection) => {
              const meta = getPlatformMeta(connection.platform);
              const isConnected = connection.status === "connected";
              return (
                <ContextMenu key={connection.id}>
                  <ContextMenuTrigger asChild>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <meta.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{meta.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {connection.accountName ?? "No account linked"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isConnected}
                          onCheckedChange={() =>
                            updateConnectionStatus(
                              connection.id,
                              isConnected ? "disconnected" : "connected"
                            )
                          }
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {connection.status === "connected"
                            ? `Synced ${dayjs(connection.lastSyncedAt).fromNow()}`
                            : connection.status === "pending"
                            ? "Awaiting approval"
                            : connection.status === "error"
                            ? "Action required"
                            : "Disconnected"}
                        </span>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {connection.status}
                        </Badge>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onSelect={() =>
                        updateConnectionStatus(
                          connection.id,
                          connection.status === "connected" ? "disconnected" : "connected"
                        )
                      }
                    >
                      {connection.status === "connected" ? "Disconnect" : "Connect"}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={() =>
                        updateConnectionStatus(
                          connection.id,
                          "pending",
                          "Awaiting verification"
                        )
                      }
                    >
                      Set as pending
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => toast.info("Manage account coming soon")}
                    >
                      Manage account
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-destructive" onSelect={() => removeConnection(connection.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove connection
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            {connections.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Plug2 className="h-5 w-5" />
                <p>No services linked yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground">
        <Plug2 className="h-12 w-12" />
        <p className="text-lg font-semibold">Connections</p>
        <p className="text-xs">Integrations appear here once connected from the left.</p>
      </section>
    </div>
  );
}
