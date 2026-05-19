import { Server } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Cpu, MemoryStick, Activity, Network } from "lucide-react";
import { memo, useEffect, useRef } from "react";

interface ServerGridProps {
  servers: Server[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ServerGrid = memo(function ServerGrid({ servers, selectedId, onSelect }: ServerGridProps) {
  if (!servers.length) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg bg-card/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
      {servers.map(server => (
        <ServerCard 
          key={server.id} 
          server={server} 
          isSelected={selectedId === server.id} 
          onClick={() => onSelect(server.id)} 
        />
      ))}
    </div>
  );
});

function ServerCard({ server, isSelected, onClick }: { server: Server, isSelected: boolean, onClick: () => void }) {
  const prevStatus = useRef(server.status);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevStatus.current !== server.status && cardRef.current) {
      cardRef.current.classList.add('animate-flash');
      setTimeout(() => {
        if (cardRef.current) cardRef.current.classList.remove('animate-flash');
      }, 1000);
    }
    prevStatus.current = server.status;
  }, [server.status]);

  const statusColors = {
    online: "bg-success/20 text-success border-success/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    offline: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const statusDots = {
    online: "bg-success",
    warning: "bg-warning animate-pulse",
    offline: "bg-destructive",
  };

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      className={cn(
        "group relative bg-card border rounded-lg p-4 cursor-pointer transition-all duration-200 overflow-hidden",
        isSelected ? "border-primary shadow-[0_0_15px_rgba(0,255,255,0.15)] bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-card/80"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            {server.name}
            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-1">{server.ip} • {server.location}</p>
        </div>
        <div className={cn("px-2 py-0.5 rounded border text-[10px] uppercase font-mono tracking-wider font-bold flex items-center gap-1.5", statusColors[server.status])}>
          <span className={cn("w-1.5 h-1.5 rounded-full", statusDots[server.status])} />
          {server.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <MetricRow icon={Cpu} label="CPU" value={`${Math.round(server.cpu || 0)}%`} alert={(server.cpu || 0) > 85} />
        <MetricRow icon={MemoryStick} label="MEM" value={`${Math.round(server.memory || 0)}%`} alert={(server.memory || 0) > 85} />
        <MetricRow icon={Activity} label="REQ/S" value={Math.round(server.requestsPerSec || 0)} />
        <MetricRow icon={Network} label="ERR" value={`${(server.errorRate || 0).toFixed(2)}%`} alert={(server.errorRate || 0) > 5} />
      </div>

      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none opacity-50" />
      )}
      
      <style>{`
        @keyframes flash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(255, 255, 255, 0.1); }
        }
        .animate-flash {
          animation: flash 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, alert }: { icon: any, label: string, value: string | number, alert?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase font-mono">{label}</span>
      </div>
      <span className={cn("text-xs font-mono font-bold tabular-nums", alert ? "text-destructive animate-pulse" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
