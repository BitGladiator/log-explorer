const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();


router.get('/:projectId', authenticate, async (req, res) => {
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
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const conditions = ['project_id = $1'];
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

      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
      params.push(search);
    }

    const where = conditions.join(' AND ');

    const [logsResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, level, message, service, host, timestamp, metadata
         FROM logs
         WHERE ${where}
         ORDER BY timestamp DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      db.query(
        `SELECT COUNT(*) as total FROM logs WHERE ${where}`,
        params
      ),
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


router.get('/:projectId/stats', authenticate, async (req, res) => {
  const { from, to } = req.query;

  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const params = [req.params.projectId];
    let timeFilter = '';

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

module.exports = router;