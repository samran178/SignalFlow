import { Router } from "express";
import {
  getServers,
  getServerById,
  getMetricsHistory,
  getAlerts,
  getDashboardSummary,
} from "../lib/monitor";

const router = Router();

router.get("/servers", (_req, res) => {
  res.json(getServers());
});

router.get("/servers/:id/metrics", (req, res) => {
  const server = getServerById(req.params.id);
  if (!server) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  res.json(getMetricsHistory(req.params.id));
});

router.get("/alerts", (_req, res) => {
  res.json(getAlerts());
});

router.get("/summary", (_req, res) => {
  res.json(getDashboardSummary());
});

export default router;
