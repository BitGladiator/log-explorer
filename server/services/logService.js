const db = require('../db');
const { logsIngestedTotal, logIngestionDuration, logsBatchSize } = require('../observability/metrics');
const logger = require('../observability/logger');
const crypto = require('crypto');


const validateLog = (log) => {
  const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
  const errors = [];

  if (!log.message || typeof log.message !== 'string') {
    errors.push('message is required and must be a string');
  }

  if (log.level && !VALID_LEVELS.includes(log.level.toLowerCase())) {
    errors.push(`level must be one of: ${VALID_LEVELS.join(', ')}`);
  }

  if (log.timestamp && isNaN(Date.parse(log.timestamp))) {
    errors.push('timestamp must be a valid ISO date string');
  }

  return errors;
};


const ingestLogs = async (projectId, logs) => {
  const end = logIngestionDuration.startTimer();
  logsBatchSize.observe(logs.length);

  try {
    const values = [];
    const params = [];
    let paramIndex = 1;

    for (const log of logs) {
      const level = (log.level || 'info').toLowerCase();
      const timestamp = log.timestamp ? new Date(log.timestamp) : new Date();
      const metadata = log.metadata || {};

      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(projectId, level, log.message, log.service || null, log.host || null, timestamp);
      params.push(); 

      logsIngestedTotal.inc({ project_id: projectId, level });
    }


    const insertQuery = `
      INSERT INTO logs (project_id, level, message, service, host, timestamp)
      SELECT * FROM unnest(
        $1::int[],
        $2::varchar[],
        $3::text[],
        $4::varchar[],
        $5::varchar[],
        $6::timestamptz[]
      )
    `;

    await db.query(insertQuery, [
      logs.map(() => projectId),
      logs.map((l) => (l.level || 'info').toLowerCase()),
      logs.map((l) => l.message),
      logs.map((l) => l.service || null),
      logs.map((l) => l.host || null),
      logs.map((l) => l.timestamp ? new Date(l.timestamp) : new Date()),
    ]);


    await db.query(
      `INSERT INTO ingestion_stats (project_id, logs_ingested, bytes_ingested)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, date)
       DO UPDATE SET
         logs_ingested  = ingestion_stats.logs_ingested  + $2,
         bytes_ingested = ingestion_stats.bytes_ingested + $3`,
      [
        projectId,
        logs.length,
        Buffer.byteLength(JSON.stringify(logs)),
      ]
    );

    end();
    logger.debug('Logs ingested', { projectId, count: logs.length });
    return { ingested: logs.length };

  } catch (err) {
    end();
    logger.error('Log ingestion failed', { projectId, error: err.message });
    throw err;
  }
};


const generateApiKey = () => {
  return `lex_${crypto.randomBytes(32).toString('hex')}`;
};


const validateApiKey = async (apiKey) => {
  const cacheKey = `apikey:${apiKey}`;
  const redis = require('../db/redis');

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { rows } = await db.query(
    'SELECT id, user_id, name FROM projects WHERE api_key = $1',
    [apiKey]
  );

  if (!rows[0]) return null;


  await redis.setex(cacheKey, 300, JSON.stringify(rows[0]));
  return rows[0];
};

module.exports = { validateLog, ingestLogs, generateApiKey, validateApiKey };