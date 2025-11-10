"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Activity, BarChart3, ClipboardList, MessageSquare, PieChart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/state/use-chat-store";
import { getPlatformMeta } from "@/lib/platforms";

const analyticsSections = [
  { id: "overview", title: "Overview", description: "High-level metrics", icon: BarChart3 },
  { id: "channels", title: "Channels", description: "Performance by platform", icon: PieChart },
  { id: "team", title: "Team", description: "Agent productivity", icon: ClipboardList },
];

export function AnalyticsTab() {
  const { analyticsSummary, teamMembers } = useChatStore();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const performance = useMemo(
    () =>
      analyticsSummary.teamPerformance.map((entry) => {
        const member = teamMembers.find((item) => item.id === entry.memberId);
        return { ...entry, name: member?.name ?? entry.memberId };
      }),
    [analyticsSummary.teamPerformance, teamMembers]
  );

  const activeSection = analyticsSections.find((section) => section.id === selectedSection) ?? null;

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-[360px] flex-col border-r border-border bg-background">
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-xs text-muted-foreground">Snapshot of your workspace</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 py-3">
            {analyticsSections.map((section) => {
              const Icon = section.icon;
              const isActive = selectedSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition ${
                    isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="min-w-0 text-left">
                    <p className="truncate font-medium">{section.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
      <section className="flex flex-1 flex-col bg-muted/20">
        {activeSection ? (
          <ScrollArea className="h-full px-8 py-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              <header className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6" />
                <div>
                  <h3 className="text-xl font-semibold">{activeSection.title}</h3>
                  <p className="text-sm text-muted-foreground">{activeSection.description}</p>
                </div>
              </header>
              {activeSection.id === "overview" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    icon={MessageSquare}
                    label="Total messages"
                    value={analyticsSummary.totalMessages.toLocaleString()}
                  />
                  <MetricCard
                    icon={Activity}
                    label="Avg. first response"
                    value={`${analyticsSummary.avgFirstResponseMinutes.toFixed(1)} min`}
                  />
                  <MetricCard
                    icon={BarChart3}
                    label="Resolution rate"
                    value={`${(analyticsSummary.resolutionRate * 100).toFixed(0)}%`}
                  />
                </div>
              )}
              {activeSection.id === "channels" && (
                <div className="space-y-3">
                  {analyticsSummary.topPlatforms.map((row) => {
                    const meta = getPlatformMeta(row.platform);
                    return (
                      <div key={row.platform} className="flex items-center justify-between rounded-md border bg-card p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {meta.name}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">{row.total.toLocaleString()} msgs</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {activeSection.id === "team" && (
                <div className="space-y-3">
                  {performance.map((member) => (
                    <div key={member.memberId} className="rounded-md border bg-card p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">
                          {member.messagesHandled.toLocaleString()} msgs
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avg response {member.avgResponseMinutes.toFixed(1)} min · CSAT {(member.csat * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <BarChart3 className="h-12 w-12" />
            <p className="text-lg font-semibold">Analytics</p>
            <p className="text-xs">Select a category to view insights.</p>
          </div>
        )}
      </section>
    </div>
  );
}

type MetricCardProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <div className="rounded-md border bg-card p-4">
      <Icon className="mb-3 h-5 w-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
