import { DashboardSummary } from "@workspace/api-client-react";
import { Server, Activity, AlertCircle, CheckCircle2, XCircle, Cpu, MemoryStick } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  summary?: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg bg-card/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard 
        title="Total Nodes" 
        value={summary.totalServers || 0} 
        icon={Server}
        color="text-primary"
        bg="bg-primary/10"
      />
      <StatCard 
        title="Online" 
        value={summary.onlineServers || 0} 
        icon={CheckCircle2}
        color="text-success"
        bg="bg-success/10"
      />
      <StatCard 
        title="Warning" 
        value={summary.warningServers || 0} 
        icon={AlertCircle}
        color="text-warning"
        bg="bg-warning/10"
      />
      <StatCard 
        title="Offline" 
        value={summary.offlineServers || 0} 
        icon={XCircle}
        color="text-destructive"
        bg="bg-destructive/10"
      />
      <StatCard 
        title="Avg CPU" 
        value={`${Math.round(summary.avgCpu || 0)}%`} 
        icon={Cpu}
        color="text-info"
        bg="bg-info/10"
      />
      <StatCard 
        title="Avg Memory" 
        value={`${Math.round(summary.avgMemory || 0)}%`} 
        icon={MemoryStick}
        color="text-chart-2"
        bg="bg-chart-2/10"
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-lg p-4 flex flex-col gap-2 overflow-hidden relative group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-md ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight font-mono tabular-nums">
        {value}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
