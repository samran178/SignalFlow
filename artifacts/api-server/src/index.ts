import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { startMonitor } from "./lib/monitor";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/api/ws/socket.io",
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected");

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected");
  });
});

startMonitor(io);

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
