const db = require("../db");
const logger = require("../observability/logger");

const getStorageStats = async (projectId) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*)                                    as total_logs,
       MIN(timestamp)                              as oldest_log,
       MAX(timestamp)                              as newest_log,
       pg_size_pretty(
         pg_total_relation_size('logs')
         * COUNT(*)::bigint
         / NULLIF((SELECT COUNT(*) FROM logs), 0)
       )                                           as estimated_size,
       COUNT(*) FILTER (WHERE level = 'error')     as error_count,
       COUNT(*) FILTER (WHERE level = 'fatal')     as fatal_count,
       COUNT(*) FILTER (WHERE level = 'warn')      as warn_count,
       COUNT(*) FILTER (WHERE level = 'info')      as info_count,
       COUNT(*) FILTER (WHERE level = 'debug')     as debug_count
     FROM logs
     WHERE project_id = $1`,
    [projectId]
  );

  return rows[0];
};

const runRetentionForProject = async (projectId) => {
  const { rows: projectRows } = await db.query(
    "SELECT retention_days FROM projects WHERE id = $1",
    [projectId]
  );

  if (!projectRows[0]) return null;

  const { retention_days } = projectRows[0];

  if (!retention_days) {
    logger.debug("Project has no retention limit — skipping", { projectId });
    return { skipped: true, projectId };
  }

  
  const { rows: cutoffRows } = await db.query(
    `SELECT NOW() - ($1::int * INTERVAL '1 day') AS cutoff`,
    [retention_days]
  );
  const cutoff = cutoffRows[0].cutoff;


  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) AS would_delete FROM logs WHERE project_id = $1 AND timestamp < $2`,
    [projectId, cutoff]
  );
  logger.info('Retention cutoff computed', {
    projectId,
    retentionDays: retention_days,
    cutoff,
    wouldDelete: countRows[0].would_delete,
  });

  const { rows: deleted } = await db.query(
    `DELETE FROM logs
     WHERE project_id = $1
       AND timestamp < $2
     RETURNING id`,
    [projectId, cutoff]
  );

  const deletedCount = deleted.length;

  if (deletedCount > 0) {
    const { rows: oldestRows } = await db.query(
      "SELECT MIN(timestamp) as oldest FROM logs WHERE project_id = $1",
      [projectId]
    );

    await db.query(
      `INSERT INTO retention_runs (project_id, deleted_count, oldest_kept)
       VALUES ($1, $2, $3)`,
      [projectId, deletedCount, oldestRows[0]?.oldest || null]
    );

    logger.info("Retention cleanup complete", {
      projectId,
      deletedCount,
      retentionDays: retention_days,
    });
  }

  return { projectId, deletedCount, retentionDays: retention_days, cutoff };
};

const runRetentionForAllProjects = async () => {
  const { rows: projects } = await db.query(
    "SELECT id FROM projects WHERE retention_days IS NOT NULL"
  );

  logger.info("Starting retention run", { projectCount: projects.length });

  const results = [];
  for (const { id } of projects) {
    try {
      const result = await runRetentionForProject(id);
      if (result) results.push(result);
    } catch (err) {
      logger.error("Retention failed for project", {
        projectId: id,
        error: err.message,
      });
    }
  }

  const totalDeleted = results.reduce((s, r) => s + (r.deletedCount || 0), 0);
  logger.info("Retention run complete", {
    totalDeleted,
    projectsProcessed: results.length,
  });

  return results;
};

const checkStorageWarning = async (projectId) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) as total_logs,
       p.storage_warning_threshold
     FROM logs l
     JOIN projects p ON p.id = l.project_id
     WHERE l.project_id = $1
     GROUP BY p.storage_warning_threshold`,
    [projectId]
  );

  if (!rows[0]) return false;

  const { total_logs, storage_warning_threshold } = rows[0];
  return parseInt(total_logs) >= parseInt(storage_warning_threshold);
};

module.exports = {
  getStorageStats,
  runRetentionForProject,
  runRetentionForAllProjects,
  checkStorageWarning,
};
