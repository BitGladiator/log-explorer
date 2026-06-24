const express = require("express");
const authenticate = require("../middleware/authenticate");
const db = require("../db");

const router = express.Router();

router.get("/:projectId", authenticate, async (req, res) => {
  const { projectId } = req.params;
  const {
    level,
    service,
    search,
    from,
    to,
    limit = 100,
    offset = 0,
  } = req.query;

  try {
    const { rows: projectRows } = await db.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.userId]
    );
    if (!projectRows[0])
      return res.status(404).json({ error: "Project not found" });

    const conditions = ["project_id = $1"];
    const params = [projectId];
    let paramIndex = 2;

    if (level) {
      conditions.push(`level = $${paramIndex++}`);
      params.push(level.toLowerCase());
    }

    if (service) {
      conditions.push(`service = $${paramIndex++}`);
      params.push(service);
    }

    if (from) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(new Date(from));
    }

    if (to) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(new Date(to));
    }

    if (search) {
      conditions.push(
        `search_vector @@ plainto_tsquery('english', $${paramIndex++})`
      );
      params.push(search);
    }

    const where = conditions.join(" AND ");

    const [logsResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, level, message, service, host, timestamp, metadata
         FROM logs
         WHERE ${where}
         ORDER BY timestamp DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      db.query(`SELECT COUNT(*) as total FROM logs WHERE ${where}`, params),
    ]);

    res.json({
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:projectId/stats", authenticate, async (req, res) => {
  const { from, to } = req.query;

  try {
    const { rows: projectRows } = await db.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0])
      return res.status(404).json({ error: "Project not found" });

    const params = [req.params.projectId];
    let timeFilter = "";

    if (from && to) {
      timeFilter = `AND timestamp BETWEEN $2 AND $3`;
      params.push(new Date(from), new Date(to));
    }

    const { rows } = await db.query(
      `SELECT
         level,
         COUNT(*) as count,
         DATE_TRUNC('hour', timestamp) as hour
       FROM logs
       WHERE project_id = $1 ${timeFilter}
       GROUP BY level, hour
       ORDER BY hour DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/:projectId/timeseries", authenticate, async (req, res) => {
  const { from, to, buckets = 24 } = req.query;

  try {
    const { rows: projectRows } = await db.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0])
      return res.status(404).json({ error: "Project not found" });

    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    const rangeMs = toDate - fromDate;
    const bucketMs = rangeMs / parseInt(buckets);

    const { rows: series } = await db.query(
      `SELECT
         DATE_TRUNC('milliseconds',
           to_timestamp(
             floor(extract(epoch from timestamp) / $2) * $2
           )
         )                                                as bucket,
         COUNT(*)                                         as total,
         COUNT(*) FILTER (WHERE level = 'debug')         as debug,
         COUNT(*) FILTER (WHERE level = 'info')          as info,
         COUNT(*) FILTER (WHERE level = 'warn')          as warn,
         COUNT(*) FILTER (WHERE level = 'error')         as error,
         COUNT(*) FILTER (WHERE level = 'fatal')         as fatal
       FROM logs
       WHERE project_id = $1
         AND timestamp BETWEEN $3 AND $4
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [req.params.projectId, bucketMs / 1000, fromDate, toDate]
    );


    const { rows: summary } = await db.query(
      `SELECT
         COUNT(*)                                         as total,
         COUNT(*) FILTER (WHERE level = 'error')         as errors,
         COUNT(*) FILTER (WHERE level = 'fatal')         as fatals,
         COUNT(*) FILTER (WHERE level = 'warn')          as warns,
         COUNT(DISTINCT service)                          as unique_services,
         COUNT(DISTINCT host)                             as unique_hosts
       FROM logs
       WHERE project_id = $1
         AND timestamp BETWEEN $2 AND $3`,
      [req.params.projectId, fromDate, toDate]
    );

    res.json({ series, summary: summary[0], from: fromDate, to: toDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
