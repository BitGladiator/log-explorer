const express = require("express");
const {
  validateLog,
  ingestLogs,
  validateApiKey,
} = require("../services/logService");
const { ingestionLimiter } = require("../middleware/rateLimiter");
const logger = require("../observability/logger");

const router = express.Router();

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing X-API-Key header" });
  }

  const project = await validateApiKey(apiKey);
  if (!project) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  req.project = project;
  next();
};

router.post("/", ingestionLimiter, authenticateApiKey, async (req, res) => {
  const { logs } = req.body;

  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: "Body must contain a logs array" });
  }

  if (logs.length === 0) {
    return res.status(400).json({ error: "Logs array cannot be empty" });
  }

  if (logs.length > 1000) {
    return res.status(400).json({ error: "Maximum 1000 logs per request" });
  }

  const errors = [];
  logs.forEach((log, i) => {
    const logErrors = validateLog(log);
    if (logErrors.length > 0) {
      errors.push({ index: i, errors: logErrors });
    }
  });

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: errors });
  }

  try {
    const result = await ingestLogs(req.project.id, logs);
    res.status(202).json(result);
  } catch (err) {
    logger.error("Ingestion error", { error: err.message });
    res.status(500).json({ error: "Ingestion failed" });
  }
});

router.post(
  "/single",
  ingestionLimiter,
  authenticateApiKey,
  async (req, res) => {
    const log = req.body;
    const errors = validateLog(log);

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });
    }

    try {
      const result = await ingestLogs(req.project.id, [log]);
      res.status(202).json(result);
    } catch (err) {
      res.status(500).json({ error: "Ingestion failed" });
    }
  }
);

module.exports = router;
