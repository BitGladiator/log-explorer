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

const authRoutes = require("./routes/auth");
const ingestRoutes = require("./routes/ingest");
const logsRoutes = require("./routes/logs");
const projectRoutes = require("./routes/projects");

const app = express();
const httpServer = createServer(app);
const queryRoutes = require('./routes/query');
const clusterRoutes = require('./routes/clusters');
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
  .map(origin => origin.trim().replace(/\/$/, ""));

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
app.use('/api/query', queryRoutes);
app.use('/api/clusters', clusterRoutes);

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
