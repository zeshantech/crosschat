"use client";

import { useMemo, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/state/use-chat-store";
import type { RolePermission } from "@/lib/types/chat";
import { cn } from "@/lib/utils";

const PERMISSION_OPTIONS: { id: RolePermission; label: string }[] = [
  { id: "view_inbox", label: "View inbox" },
  { id: "manage_notifications", label: "Manage notifications" },
  { id: "manage_connections", label: "Manage connections" },
  { id: "manage_members", label: "Manage members" },
  { id: "view_analytics", label: "View analytics" },
  { id: "configure_settings", label: "Configure settings" },
];

export function RolesTab() {
  const { roles, createRole, deleteRole, renameRole, updateRolePermissions, teamMembers, updateMemberRole } =
    useChatStore();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("New role");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const handleCreate = () => {
    const id = `role_${Math.random().toString(36).slice(2, 8)}`;
    createRole({ id, label: draftName, permissions: ["view_inbox"] });
    setSelectedRoleId(id);
    setCreating(false);
    setDraftName("New role");
  };

  const togglePermission = (permission: RolePermission) => {
    if (!selectedRole) return;
    const current = new Set(selectedRole.permissions);
    if (current.has(permission)) {
      current.delete(permission);
    } else {
      current.add(permission);
    }
    updateRolePermissions(selectedRole.id, Array.from(current));
  };

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Roles</h2>
          {creating ? (
            <div className="flex items-center gap-2">
              <Input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="h-8 w-32"
                autoFocus
              />
              <Button size="sm" onClick={handleCreate}>
                Save
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {roles.map((role) => {
              const isActive = selectedRoleId === role.id;
              const isEditing = editingRoleId === role.id;
              return (
                <ContextMenu key={role.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        if (!isEditing) setEditingRoleId(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition",
                        isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
                      )}
                    >
                      {isEditing ? (
                        <Input
                          value={editingLabel}
                          onChange={(event) => setEditingLabel(event.target.value)}
                          onBlur={() => {
                            if (editingLabel.trim()) renameRole(role.id, editingLabel.trim());
                            setEditingRoleId(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              if (editingLabel.trim()) renameRole(role.id, editingLabel.trim());
                              setEditingRoleId(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="font-medium">{role.label}</span>
                      )}
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {role.permissions.length} perms
                      </Badge>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onSelect={() => {
                        setEditingRoleId(role.id);
                        setEditingLabel(role.label);
                      }}
                    >
                      Edit name
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={() =>
                        createRole({
                          id: `role_${Math.random().toString(36).slice(2, 8)}`,
                          label: `${role.label} copy`,
                          permissions: role.permissions,
                        })
                      }
                    >
                      Duplicate role
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-destructive" onSelect={() => deleteRole(role.id)}>
                      Delete role
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
            {roles.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-5 w-5" />
                <p>No roles defined yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col bg-muted/20">
        {selectedRole ? (
          <ScrollArea className="h-full px-8 py-8">
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              <header className="flex items-center justify-between gap-2">
                <ShieldCheck className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-xl font-semibold">{selectedRole.label}</p>
                  <p className="text-sm text-muted-foreground">Assign permissions and members.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      createRole({
                        id: `role_${Math.random().toString(36).slice(2, 8)}`,
                        label: `${selectedRole.label} copy`,
                        permissions: selectedRole.permissions,
                      })
                    }
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      deleteRole(selectedRole.id);
                      setSelectedRoleId(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </header>
              <div className="space-y-3">
                {PERMISSION_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center justify-between rounded-md border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium leading-tight">{option.label}</p>
                      <p className="text-xs text-muted-foreground">Permission id: {option.id}</p>
                    </div>
                    <Checkbox
                      checked={selectedRole.permissions.includes(option.id)}
                      onCheckedChange={() => togglePermission(option.id)}
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Assign to members</p>
                <div className="space-y-1 rounded-md border bg-card p-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span>{member.name}</span>
                      <Button
                        variant={member.role === selectedRole.label ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => updateMemberRole(member.id, selectedRole.label)}
                      >
                        {member.role === selectedRole.label ? "Assigned" : "Assign"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShieldCheck className="h-12 w-12" />
            <p className="text-lg font-semibold">Roles</p>
            <p className="text-xs">Select or create a role to edit permissions.</p>
          </div>
        )}
      </section>
    </div>
  );
}
