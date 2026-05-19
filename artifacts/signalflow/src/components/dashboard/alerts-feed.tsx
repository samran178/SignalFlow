import { Alert } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Info, AlertTriangle, AlertOctagon, ServerCrash, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsFeedProps {
  alerts: Alert[];
}

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  if (!alerts.length) {
    return (
      <div className="flex-1 border border-border/50 border-dashed rounded-lg flex items-center justify-center bg-card/20 text-muted-foreground text-sm font-mono p-8 text-center">
        No active alerts detected.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-4 flex-1">
      {alerts.map((alert, index) => (
        <AlertItem key={`${alert.id}-${index}`} alert={alert} isNew={index === 0} />
      ))}
    </div>
  );
}

function AlertItem({ alert, isNew }: { alert: Alert, isNew: boolean }) {
  const getIcon = () => {
    switch (alert.type) {
      case 'server_down': return ServerCrash;
      case 'server_up': return ArrowUpCircle;
      case 'cpu':
      case 'memory':
      case 'error_rate':
      default:
        return alert.severity === 'critical' ? AlertOctagon : 
               alert.severity === 'warning' ? AlertTriangle : Info;
    }
  };

  const getColors = () => {
    switch (alert.severity) {
      case 'critical': return "border-destructive/30 bg-destructive/5 text-destructive";
      case 'warning': return "border-warning/30 bg-warning/5 text-warning";
      case 'info': return "border-info/30 bg-info/5 text-info";
      default: return "border-border bg-card text-foreground";
    }
  };

  const Icon = getIcon();

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border text-sm flex gap-3 items-start",
        getColors(),
        isNew && "animate-in slide-in-from-top-4 fade-in duration-300"
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="font-bold font-mono uppercase tracking-tight text-[11px] truncate">
            {alert.serverName}
          </span>
          <span className="text-[10px] font-mono opacity-70 whitespace-nowrap">
            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">
          {alert.message}
        </p>
      </div>
    </div>
  );
}
