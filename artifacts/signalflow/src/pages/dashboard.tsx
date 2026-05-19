import { useState, useEffect } from "react";
import { useGetServers, useGetDashboardSummary, useGetAlerts, useGetServerMetrics, Server, Alert } from "@workspace/api-client-react";
import { useSignalFlowSocket } from "@/hooks/use-socket";
import { Header } from "@/components/dashboard/header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ServerGrid } from "@/components/dashboard/server-grid";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { ServerChart } from "@/components/dashboard/server-chart";

export default function Dashboard() {
  const { data: initialServers } = useGetServers();
  const { data: initialSummary } = useGetDashboardSummary();
  const { data: initialAlerts } = useGetAlerts();
  
  const { isConnected, servers: liveServers, alerts: liveAlerts, summary: liveSummary, liveMetrics, setAlerts } = useSignalFlowSocket();

  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  // Initialize socket state from REST if socket hasn't fired yet
  const displayServers = liveServers.length > 0 ? liveServers : (initialServers || []);
  
  // Combine initial alerts and live alerts, ensuring uniqueness by ID
  const allAlertsMap = new Map<string, Alert>();
  (initialAlerts || []).forEach(a => allAlertsMap.set(a.id, a));
  liveAlerts.forEach(a => allAlertsMap.set(a.id, a));
  const displayAlerts = Array.from(allAlertsMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const displaySummary = {
    ...initialSummary,
    ...liveSummary,
    totalAlerts: displayAlerts.length || initialSummary?.totalAlerts || 0
  };

  const selectedServer = displayServers.find(s => s.id === selectedServerId) || null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Header isConnected={isConnected} />
      
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-h-[calc(100vh-64px)] overflow-y-auto">
        <div className="xl:col-span-9 flex flex-col gap-6">
          <SummaryCards summary={displaySummary as any} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col min-h-[400px]">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Fleet Overview
              </h2>
              <ServerGrid 
                servers={displayServers} 
                selectedId={selectedServerId} 
                onSelect={setSelectedServerId} 
              />
            </div>
            
            <div className="lg:col-span-1 flex flex-col h-full min-h-[400px]">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">
                Telemetry 
              </h2>
              {selectedServer ? (
                <ServerChart server={selectedServer} liveMetric={liveMetrics[selectedServer.id]} />
              ) : (
                <div className="flex-1 border border-border/50 border-dashed rounded-lg flex items-center justify-center bg-card/20 text-muted-foreground text-sm font-mono p-8 text-center">
                  Select a node from the fleet to view telemetry
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 flex flex-col max-h-full overflow-hidden">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">
            System Alerts
          </h2>
          <AlertsFeed alerts={displayAlerts} />
        </div>
      </main>
    </div>
  );
}
