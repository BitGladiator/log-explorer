require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { execSync } = require("child_process");

const requestMetrics = require("./middleware/requestMetrics");
const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");
const { register, activeConnections } = require("./observability/metrics");
const logger = require("./observability/logger");
const cron = require("node-cron");
const { checkAllAlertRules } = require("./services/alertService");
const authRoutes = require("./routes/auth");
const ingestRoutes = require("./routes/ingest");
const logsRoutes = require("./routes/logs");
const projectRoutes = require("./routes/projects");
const alertRoutes = require("./routes/alerts");
const { runAnomalyDetectionForAllProjects } = require('./services/anomalyService');
const anomalyRoutes = require('./routes/anomalies');
const retentionRoutes = require('./routes/retention');

const { runRetentionForAllProjects } = require('./services/retentionService');
const app = express();
const httpServer = createServer(app);
const queryRoutes = require("./routes/query");
const clusterRoutes = require("./routes/clusters");
try {
  logger.info("Running migrations...");
  execSync("npm run migrate:up", { cwd: __dirname, stdio: "inherit" });
  logger.info("Migrations complete");
} catch (err) {
  logger.error("Migration failed", { error: err.message });
  process.exit(1);
}

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.trim().toLowerCase().replace(/\/$/, "");
    const isAllowed = allowedOrigins.some(
      (allowed) => allowed.toLowerCase() === normalizedOrigin
    );
    if (isAllowed || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      logger.warn("CORS blocked request", { origin });
      callback(null, false);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ["websocket"],
});

module.exports.io = io;
cron.schedule("* * * * *", async () => {
  try {
    await checkAllAlertRules(io);
  } catch (err) {
    logger.error("Alert check cron failed", { error: err.message });
  }
});
cron.schedule('*/5 * * * *', async () => {
  try {
    await runAnomalyDetectionForAllProjects(io);
  } catch (err) {
    logger.error('Anomaly detection cron failed', { error: err.message });
  }
});
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting nightly retention cleanup');
  try {
    await runRetentionForAllProjects();
  } catch (err) {
    logger.error('Retention cron failed', { error: err.message });
  }
});

logger.info('Retention scheduler running — cleanup at 2am daily');
logger.info('Anomaly detector scheduled — runs every 5 minutes');
logger.info("Alert checker scheduled — runs every minute");
io.on("connection", (socket) => {
  activeConnections.inc();
  logger.debug("WebSocket connected", { socketId: socket.id });

  socket.on("subscribe", (projectId) => {
    socket.join(`project:${projectId}`);
    logger.debug("Subscribed to project", { projectId });
  });

  socket.on("unsubscribe", (projectId) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on("disconnect", () => {
    activeConnections.dec();
  });
});

app.use(helmet());
app.use(compression());
app.use(requestMetrics);
app.use(globalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/clusters", clusterRoutes);
app.use("/api/alerts", alertRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/retention', retentionRoutes);

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
);

app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, requestId: req.id });
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

const PORT = process.env.PORT || 5500;
httpServer.listen(PORT, () =>
  logger.info(`Log Explorer server running on port ${PORT}`)
);
