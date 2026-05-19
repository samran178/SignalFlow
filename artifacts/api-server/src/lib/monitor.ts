import { Server as SocketServer } from "socket.io";
import { logger } from "./logger";

export interface ServerNode {
  id: string;
  name: string;
  status: "online" | "warning" | "offline";
  location: string;
  uptime: number;
  ip: string;
  cpu: number;
  memory: number;
  requestsPerSec: number;
  errorRate: number;
}

export interface MetricPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  requestsPerSec: number;
  errorRate: number;
  network: number;
}

export interface Alert {
  id: string;
  serverId: string;
  serverName: string;
  type: "cpu" | "memory" | "error_rate" | "server_down" | "server_up";
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

const SERVERS: ServerNode[] = [
  { id: "us-east-1", name: "prod-api-01", status: "online", location: "US East", uptime: 99.98, ip: "10.0.1.10", cpu: 35, memory: 52, requestsPerSec: 1240, errorRate: 0.2 },
  { id: "us-west-2", name: "prod-api-02", status: "online", location: "US West", uptime: 99.95, ip: "10.0.2.10", cpu: 28, memory: 44, requestsPerSec: 980, errorRate: 0.1 },
  { id: "eu-central", name: "prod-eu-01", status: "online", location: "EU Central", uptime: 99.91, ip: "10.1.1.10", cpu: 61, memory: 73, requestsPerSec: 620, errorRate: 0.5 },
  { id: "ap-southeast", name: "prod-ap-01", status: "warning", location: "AP Southeast", uptime: 98.7, ip: "10.2.1.10", cpu: 84, memory: 87, requestsPerSec: 310, errorRate: 3.1 },
  { id: "us-east-2", name: "cache-redis-01", status: "online", location: "US East", uptime: 99.99, ip: "10.0.1.20", cpu: 12, memory: 35, requestsPerSec: 4200, errorRate: 0.0 },
  { id: "us-west-db", name: "db-primary-01", status: "online", location: "US West", uptime: 99.97, ip: "10.0.2.20", cpu: 45, memory: 68, requestsPerSec: 520, errorRate: 0.3 },
];

// History store: last 60 data points per server
const metricsHistory: Map<string, MetricPoint[]> = new Map();
const alerts: Alert[] = [];
let alertCounter = 0;

for (const server of SERVERS) {
  // Pre-fill with 60 points of history
  const history: MetricPoint[] = [];
  for (let i = 59; i >= 0; i--) {
    const t = new Date(Date.now() - i * 1000);
    history.push({
      timestamp: t.toISOString(),
      cpu: clamp(server.cpu + randVariance(10), 0, 100),
      memory: clamp(server.memory + randVariance(5), 0, 100),
      requestsPerSec: Math.max(0, server.requestsPerSec + randVariance(150)),
      errorRate: Math.max(0, server.errorRate + randVariance(0.5)),
      network: Math.max(0, 120 + randVariance(60)),
    });
  }
  metricsHistory.set(server.id, history);
}

function randVariance(range: number): number {
  return (Math.random() - 0.5) * 2 * range;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function generateAlert(server: ServerNode, type: Alert["type"], severity: Alert["severity"], message: string) {
  const alert: Alert = {
    id: `alert-${++alertCounter}`,
    serverId: server.id,
    serverName: server.name,
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
  };
  alerts.unshift(alert);
  if (alerts.length > 50) alerts.pop();
  return alert;
}

export function getServers(): ServerNode[] {
  return SERVERS;
}

export function getServerById(id: string): ServerNode | undefined {
  return SERVERS.find((s) => s.id === id);
}

export function getMetricsHistory(serverId: string): MetricPoint[] {
  return metricsHistory.get(serverId) ?? [];
}

export function getAlerts(): Alert[] {
  return alerts;
}

export function getDashboardSummary() {
  const online = SERVERS.filter((s) => s.status === "online").length;
  const warning = SERVERS.filter((s) => s.status === "warning").length;
  const offline = SERVERS.filter((s) => s.status === "offline").length;
  const avgCpu = SERVERS.reduce((a, s) => a + s.cpu, 0) / SERVERS.length;
  const avgMemory = SERVERS.reduce((a, s) => a + s.memory, 0) / SERVERS.length;
  return {
    totalServers: SERVERS.length,
    onlineServers: online,
    warningServers: warning,
    offlineServers: offline,
    totalAlerts: alerts.length,
    avgCpu: Math.round(avgCpu * 10) / 10,
    avgMemory: Math.round(avgMemory * 10) / 10,
  };
}

export function startMonitor(io: SocketServer): void {
  logger.info("Starting real-time monitor");

  // Simulate a server going offline after 15s, recovering after 30s
  let offlineSimulated = false;
  let recoverySimulated = false;
  const startTime = Date.now();

  setInterval(() => {
    const elapsed = Date.now() - startTime;

    // After 15s: take ap-southeast offline
    if (!offlineSimulated && elapsed > 15000) {
      offlineSimulated = true;
      const server = SERVERS.find((s) => s.id === "ap-southeast")!;
      server.status = "offline";
      const alert = generateAlert(server, "server_down", "critical", `${server.name} is unreachable — connection timed out`);
      io.emit("server_status_change", { server });
      io.emit("alert_triggered", { alert });
      logger.info({ serverId: server.id }, "Simulated server down");
    }

    // After 40s: recover it
    if (!recoverySimulated && elapsed > 40000) {
      recoverySimulated = true;
      const server = SERVERS.find((s) => s.id === "ap-southeast")!;
      server.status = "online";
      server.cpu = 40;
      server.memory = 55;
      server.errorRate = 0.4;
      const alert = generateAlert(server, "server_up", "info", `${server.name} is back online`);
      io.emit("server_status_change", { server });
      io.emit("alert_triggered", { alert });
      logger.info({ serverId: server.id }, "Simulated server recovery");
    }

    // Tick every server
    for (const server of SERVERS) {
      if (server.status === "offline") {
        // No metrics for offline servers
        continue;
      }

      // Slowly drift metrics with random walk
      server.cpu = clamp(server.cpu + randVariance(4), 2, 98);
      server.memory = clamp(server.memory + randVariance(2), 10, 98);
      server.requestsPerSec = Math.max(0, server.requestsPerSec + randVariance(80));
      server.errorRate = Math.max(0, server.errorRate + randVariance(0.3));

      // Spike simulation: 5% chance of a CPU spike
      if (Math.random() < 0.05) {
        server.cpu = clamp(server.cpu + 20, 0, 99);
        if (server.cpu > 90 && server.status === "online") {
          server.status = "warning";
          const alert = generateAlert(server, "cpu", "warning", `${server.name} CPU at ${Math.round(server.cpu)}%`);
          io.emit("server_status_change", { server });
          io.emit("alert_triggered", { alert });
        }
      } else if (server.status === "warning" && server.cpu < 75 && server.errorRate < 2) {
        server.status = "online";
        io.emit("server_status_change", { server });
      }

      const point: MetricPoint = {
        timestamp: new Date().toISOString(),
        cpu: Math.round(server.cpu * 10) / 10,
        memory: Math.round(server.memory * 10) / 10,
        requestsPerSec: Math.round(server.requestsPerSec),
        errorRate: Math.round(server.errorRate * 100) / 100,
        network: Math.max(0, Math.round((80 + randVariance(60)) * 10) / 10),
      };

      const history = metricsHistory.get(server.id)!;
      history.push(point);
      if (history.length > 120) history.shift();
    }

    // Broadcast all server states + new metric point
    io.emit("metrics_update", {
      servers: SERVERS,
      timestamp: new Date().toISOString(),
    });
  }, 1000);
}
