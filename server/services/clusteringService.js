const crypto = require('crypto');
const db = require('../db');
const logger = require('../observability/logger');

const normalizeMessage = (message) => {
  return message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>') 
    .replace(/\b[a-z]+_[a-zA-Z0-9]+\b/g, '<ID>') 
    .replace(/\b\d+\b/g, '<NUM>') 
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const getClusterKey = (normalizedMessage, level, service) => {
  const hash = crypto
    .createHash('sha256')
    .update(`${level}:${service || ''}:${normalizedMessage}`)
    .digest('hex');
  return hash.substring(0, 32);
};


const updateClusters = async (projectId, logs) => {

  const relevantLogs = logs.filter((l) =>
    ['warn', 'error', 'fatal'].includes(l.level)
  );

  if (relevantLogs.length === 0) return;

  for (const log of relevantLogs) {
    try {
      const normalized = normalizeMessage(log.message);
      const clusterKey = getClusterKey(normalized, log.level, log.service);

      await db.query(
        `INSERT INTO error_clusters
           (project_id, cluster_key, representative_message, level, service,
            occurrence_count, first_seen, last_seen)
         VALUES ($1, $2, $3, $4, $5, 1, $6, $6)
         ON CONFLICT (project_id, cluster_key)
         DO UPDATE SET
           occurrence_count = error_clusters.occurrence_count + 1,
           last_seen = $6`,
        [projectId, clusterKey, log.message, log.level, log.service, log.timestamp]
      );
    } catch (err) {
      logger.error('Cluster update failed', { error: err.message });
    }
  }
};


const getClusters = async (projectId, options = {}) => {
  const { limit = 20, sinceHours = 24 } = options;

  const { rows } = await db.query(
    `SELECT * FROM error_clusters
     WHERE project_id = $1
       AND last_seen >= NOW() - INTERVAL '1 hour' * $2
     ORDER BY occurrence_count DESC, last_seen DESC
     LIMIT $3`,
    [projectId, sinceHours, limit]
  );

  return rows;
};

module.exports = { normalizeMessage, getClusterKey, updateClusters, getClusters };