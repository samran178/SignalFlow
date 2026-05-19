import { useEffect, useState } from "react";
import { Server, Activity, Wifi, WifiOff } from "lucide-react";

export function Header({ isConnected }: { isConnected: boolean }) {
  const [time, setTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-md border border-primary/20">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">SignalFlow</h1>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-2">v2.4.1</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 font-mono text-sm text-muted-foreground bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
          {time}
        </div>
        
        <div className="flex items-center gap-2 text-sm font-mono">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-success" />
              <span className="text-success animate-pulse">CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-destructive" />
              <span className="text-destructive">DISCONNECTED</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
