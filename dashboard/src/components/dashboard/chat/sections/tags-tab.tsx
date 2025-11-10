"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Tag, Tags } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/state/use-chat-store";
import { cn } from "@/lib/utils";

export function TagsTab() {
  const { tags, conversations, createTag, deleteTag, renameTag } = useChatStore();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");

  const usage = useMemo(() => {
    const counts: Record<string, number> = {};
    conversations.forEach((conversation) => {
      conversation.tags?.forEach((tag) => {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      });
    });
    return counts;
  }, [conversations]);

  const startEditing = (tagId: string, currentLabel: string) => {
    setEditingTagId(tagId);
    setDraftLabel(currentLabel);
  };

  const commitRename = () => {
    if (editingTagId && draftLabel.trim()) {
      renameTag(editingTagId, draftLabel.trim());
    }
    setEditingTagId(null);
    setDraftLabel("");
  };

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Labels</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const id = `tag_${nanoid(6)}`;
              createTag({ id, label: "New label", color: "#22c55e" });
              setSelectedTagId(id);
              startEditing(id, "New label");
            }}
          >
            <Tag className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {tags.map((tag) => {
              const isActive = selectedTagId === tag.id;
              const isEditing = editingTagId === tag.id;
              return (
                <ContextMenu key={tag.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => {
                        setSelectedTagId(tag.id);
                        if (!isEditing) startEditing(tag.id, tag.label);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted",
                        isActive && "bg-secondary text-secondary-foreground"
                      )}
                    >
                      <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                        #
                      </Badge>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <Input
                            value={draftLabel}
                            onChange={(event) => setDraftLabel(event.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitRename();
                              } else if (event.key === "Escape") {
                                setEditingTagId(null);
                              }
                            }}
                            autoFocus
                            className="h-8 bg-background"
                          />
                        ) : (
                          <p className="truncate font-medium">{tag.label}</p>
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {usage[tag.id] ?? 0} conversation(s)
                        </p>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={() => startEditing(tag.id, tag.label)}>
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-destructive" onSelect={() => deleteTag(tag.id)}>
                      Delete label
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            {tags.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Tags className="h-5 w-5" />
                <p>No labels yet. Create one to get started.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground">
        <Tags className="h-12 w-12" />
        <p className="text-lg font-semibold">Labels</p>
        <p className="text-xs">Organise conversations by assigning labels on the left.</p>
      </section>
    </div>
  );
}
