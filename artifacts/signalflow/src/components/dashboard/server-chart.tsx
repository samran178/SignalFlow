import { Server, MetricPoint, useGetServerMetrics } from "@workspace/api-client-react";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

interface ServerChartProps {
  server: Server;
  liveMetric?: MetricPoint;
}

export function ServerChart({ server, liveMetric }: ServerChartProps) {
  const { data: initialMetrics, isLoading } = useGetServerMetrics(server.id);
  const [data, setData] = useState<MetricPoint[]>([]);

  // Reset data when server changes
  useEffect(() => {
    if (initialMetrics) {
      setData(initialMetrics.slice(-60));
    }
  }, [initialMetrics, server.id]);

  // Append live metrics
  useEffect(() => {
    if (liveMetric && data.length > 0) {
      setData(prev => {
        // Only append if it's a new timestamp to prevent duplicates
        if (prev[prev.length - 1].timestamp === liveMetric.timestamp) {
          return prev;
        }
        return [...prev, liveMetric].slice(-60); // Keep exactly 60 points
      });
    }
  }, [liveMetric]);

  if (isLoading && !data.length) {
    return <Skeleton className="w-full h-full min-h-[300px] rounded-lg bg-card/40" />;
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-lg shadow-xl backdrop-blur font-mono text-xs">
          <p className="text-muted-foreground mb-2">{formatTime(label)}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
              <span style={{ color: p.color }} className="uppercase">{p.name}</span>
              <span className="font-bold text-foreground">{p.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 bg-card border border-border/50 rounded-lg p-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Activity className="w-24 h-24 text-primary" />
      </div>

      <div className="mb-6 relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{server.name}</h3>
          <p className="text-xs font-mono text-muted-foreground">{server.id}</p>
        </div>
        <div className="flex gap-4 font-mono text-xs text-right">
          <div>
            <div className="text-muted-foreground uppercase text-[10px]">CPU</div>
            <div className="text-primary font-bold text-lg">{Math.round(server.cpu || 0)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase text-[10px]">MEM</div>
            <div className="text-info font-bold text-lg">{Math.round(server.memory || 0)}%</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10} 
              tickMargin={10}
              fontFamily="var(--font-mono)"
              minTickGap={30}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              fontFamily="var(--font-mono)"
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              name="CPU" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCpu)" 
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="memory" 
              name="Mem" 
              stroke="hsl(var(--info))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMem)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
