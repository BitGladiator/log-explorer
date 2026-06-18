const db = require("../db");
const {
  logsIngestedTotal,
  logIngestionDuration,
  logsBatchSize,
} = require("../observability/metrics");
const logger = require("../observability/logger");
const crypto = require("crypto");

const validateLog = (log) => {
  const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
  const errors = [];

  if (!log.message || typeof log.message !== "string") {
    errors.push("message is required and must be a string");
  }
  if (log.level && !VALID_LEVELS.includes(log.level.toLowerCase())) {
    errors.push(`level must be one of: ${VALID_LEVELS.join(", ")}`);
  }
  if (log.timestamp && isNaN(Date.parse(log.timestamp))) {
    errors.push("timestamp must be a valid ISO date string");
  }
  return errors;
};

const ingestLogs = async (projectId, logs) => {
  const end = logIngestionDuration.startTimer();
  logsBatchSize.observe(logs.length);

  try {
    const shapedLogs = logs.map((l) => ({
      level: (l.level || "info").toLowerCase(),
      message: l.message,
      service: l.service || null,
      host: l.host || null,
      timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
      metadata: l.metadata || {},
    }));

    const insertQuery = `
      INSERT INTO logs (project_id, level, message, service, host, timestamp, metadata)
      SELECT * FROM unnest(
        $1::int[], $2::varchar[], $3::text[],
        $4::varchar[], $5::varchar[], $6::timestamptz[], $7::jsonb[]
      )
      RETURNING id, level, message, service, host, timestamp, metadata
    `;

    const { rows: insertedLogs } = await db.query(insertQuery, [
      shapedLogs.map(() => projectId),
      shapedLogs.map((l) => l.level),
      shapedLogs.map((l) => l.message),
      shapedLogs.map((l) => l.service),
      shapedLogs.map((l) => l.host),
      shapedLogs.map((l) => l.timestamp),
      shapedLogs.map((l) => JSON.stringify(l.metadata)),
    ]);

    shapedLogs.forEach((l) => {
      logsIngestedTotal.inc({ project_id: projectId, level: l.level });
    });

    await db.query(
      `INSERT INTO ingestion_stats (project_id, logs_ingested, bytes_ingested)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, date)
       DO UPDATE SET
         logs_ingested  = ingestion_stats.logs_ingested  + $2,
         bytes_ingested = ingestion_stats.bytes_ingested + $3`,
      [projectId, logs.length, Buffer.byteLength(JSON.stringify(logs))]
    );

    
    try {
      const { io } = require("../index");
      if (io) {
        io.to(`project:${projectId}`).emit("new_logs", insertedLogs);
      }
    } catch (err) {
      logger.error("Failed to emit logs via WebSocket", { error: err.message });
    }

    end();
    logger.debug("Logs ingested", { projectId, count: logs.length });
    return { ingested: logs.length };
  } catch (err) {
    end();
    logger.error("Log ingestion failed", { projectId, error: err.message });
    throw err;
  }
};

const generateApiKey = () => `lex_${crypto.randomBytes(30).toString("hex")}`;

const validateApiKey = async (apiKey) => {
  const cacheKey = `apikey:${apiKey}`;
  const redis = require("../db/redis");

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { rows } = await db.query(
    "SELECT id, user_id, name FROM projects WHERE api_key = $1",
    [apiKey]
  );
  if (!rows[0]) return null;

  await redis.setex(cacheKey, 300, JSON.stringify(rows[0]));
  return rows[0];
};

module.exports = { validateLog, ingestLogs, generateApiKey, validateApiKey };
