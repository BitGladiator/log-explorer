const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');
const { translateQuery, resolveTimeRange } = require('../agents/queryTranslator');

const router = express.Router();

router.post('/:projectId/natural', authenticate, async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });


    const { success, filters, tokens } = await translateQuery(query);

    if (!success) {
      return res.status(500).json({ error: 'Could not understand the query' });
    }


    const conditions = ['project_id = $1'];
    const params = [req.params.projectId];
    let paramIndex = 2;

    if (filters.levels && filters.levels.length > 0) {
      conditions.push(`level = ANY($${paramIndex++})`);
      params.push(filters.levels);
    }

    if (filters.service) {
      conditions.push(`service = $${paramIndex++}`);
      params.push(filters.service);
    }

    if (filters.search) {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
      params.push(filters.search);
    }

    const sinceDate = resolveTimeRange(filters.time_range);
    if (sinceDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(sinceDate);
    }

    const where = conditions.join(' AND ');

    const { rows } = await db.query(
      `SELECT id, level, message, service, host, timestamp, metadata
       FROM logs
       WHERE ${where}
       ORDER BY timestamp DESC
       LIMIT 200`,
      params
    );

    res.json({
      logs: rows,
      interpretation: filters.interpretation,
      filters_applied: filters,
      tokens_used: tokens,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;