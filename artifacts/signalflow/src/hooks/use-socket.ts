import { io, Socket } from "socket.io-client";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Server, MetricPoint, Alert, DashboardSummary } from "@workspace/api-client-react";

type SocketEvents = {
  metrics_update: (payload: { servers: Server[]; timestamp: string }) => void;
  server_status_change: (payload: { server: Server }) => void;
  alert_triggered: (payload: { alert: Alert }) => void;
};

let socketInstance: Socket | null = null;

export function useSignalFlowSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, MetricPoint>>({});
  
  // Real-time stat derived from socket
  const [summary, setSummary] = useState<Partial<DashboardSummary>>({});

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io("/", { path: "/api/ws/socket.io" });
    }

    const socket = socketInstance;

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onMetricsUpdate(payload: { servers: Server[]; timestamp: string }) {
      setServers(payload.servers);
      
      // Update real-time metrics map
      const newMetrics: Record<string, MetricPoint> = {};
      let totalCpu = 0;
      let totalMem = 0;
      let online = 0;
      let warning = 0;
      let offline = 0;
      
      payload.servers.forEach(s => {
        newMetrics[s.id] = {
          timestamp: payload.timestamp,
          cpu: s.cpu || 0,
          memory: s.memory || 0,
          requestsPerSec: s.requestsPerSec || 0,
          errorRate: s.errorRate || 0,
          network: 0
        };
        
        totalCpu += s.cpu || 0;
        totalMem += s.memory || 0;
        if (s.status === 'online') online++;
        if (s.status === 'warning') warning++;
        if (s.status === 'offline') offline++;
      });
      
      setLiveMetrics(prev => ({ ...prev, ...newMetrics }));
      
      setSummary(prev => ({
        ...prev,
        totalServers: payload.servers.length,
        onlineServers: online,
        warningServers: warning,
        offlineServers: offline,
        avgCpu: payload.servers.length ? totalCpu / payload.servers.length : 0,
        avgMemory: payload.servers.length ? totalMem / payload.servers.length : 0,
      }));
    }

    function onServerStatusChange(payload: { server: Server }) {
      setServers(prev => prev.map(s => s.id === payload.server.id ? payload.server : s));
    }

    function onAlertTriggered(payload: { alert: Alert }) {
      setAlerts(prev => [payload.alert, ...prev].slice(0, 15));
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("metrics_update", onMetricsUpdate);
    socket.on("server_status_change", onServerStatusChange);
    socket.on("alert_triggered", onAlertTriggered);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("metrics_update", onMetricsUpdate);
      socket.off("server_status_change", onServerStatusChange);
      socket.off("alert_triggered", onAlertTriggered);
    };
  }, []);

  return { isConnected, servers, alerts, setAlerts, setServers, liveMetrics, summary, setSummary };
}
