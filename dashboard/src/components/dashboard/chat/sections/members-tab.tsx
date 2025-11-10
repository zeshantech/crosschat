"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { MailPlus, Trash2, Users } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useChatStore } from "@/lib/state/use-chat-store";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  agent: "Agent",
  viewer: "Viewer",
  ai: "AI assistant",
};

export function MembersTab() {
  const { teamMembers, inviteMember, updateMemberRole, removeMember, roles } = useChatStore();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const initialRole = roles[0]?.label ?? "agent";
  const [form, setForm] = useState({ name: "", email: "", role: initialRole });

  const selectedMember = useMemo(
    () => teamMembers.find((member) => member.id === selectedMemberId) ?? null,
    [teamMembers, selectedMemberId]
  );

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const id = `member_${Math.random().toString(36).slice(2, 8)}`;
    inviteMember({
      id,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: "offline",
      lastActiveAt: new Date().toISOString(),
    });
    setSelectedMemberId(id);
    setForm({ name: "", email: "", role: roles[0]?.label ?? "agent" });
    setDialogOpen(false);
  };

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Team members</h2>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <MailPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Add teammate</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length
                      ? roles.map((role) => (
                          <SelectItem key={role.id} value={role.label}>
                            {role.label}
                          </SelectItem>
                        ))
                      : Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} className="w-full">
                  Invite member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {teamMembers.map((member) => {
              const isActive = selectedMemberId === member.id;
              return (
                <ContextMenu key={member.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                        isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 text-left">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-[10px] uppercase">
                        {
                          roles.find((role) => role.label === member.role)?.label ??
                          roleLabels[member.role] ??
                          member.role
                        }
                      </Badge>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>Assign role</ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        {roles.length
                          ? roles.map((role) => (
                              <ContextMenuItem
                                key={role.id}
                                onSelect={() => updateMemberRole(member.id, role.label)}
                              >
                                {role.label}
                              </ContextMenuItem>
                            ))
                          : Object.entries(roleLabels).map(([value, label]) => (
                              <ContextMenuItem
                                key={value}
                                onSelect={() => updateMemberRole(member.id, value)}
                              >
                                {label}
                              </ContextMenuItem>
                            ))}
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-destructive" onSelect={() => removeMember(member.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove member
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            {teamMembers.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Users className="h-5 w-5" />
                <p>No teammates yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground">
        <Users className="h-12 w-12" />
        <p className="text-lg font-semibold">Team</p>
        <p className="text-xs">Manage members using the list on the left.</p>
        {selectedMember && (
          <p className="text-[11px] text-muted-foreground">
            Last active {dayjs(selectedMember.lastActiveAt).fromNow()}
          </p>
        )}
      </section>
    </div>
  );
}
