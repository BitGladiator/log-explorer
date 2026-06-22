const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');
const {
  getStorageStats,
  runRetentionForProject,
  checkStorageWarning,
} = require('../services/retentionService');

const router = express.Router();

const VALID_RETENTION_DAYS = [1,7, 14, 30, 60, 90, 180, 365, null]; 


router.get('/:projectId/stats', authenticate, async (req, res) => {
  try {
    const { rows: projectRows } = await db.query(
      'SELECT id, retention_days, storage_warning_threshold FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const [stats, isWarning] = await Promise.all([
      getStorageStats(req.params.projectId),
      checkStorageWarning(req.params.projectId),
    ]);

    const { rows: lastRun } = await db.query(
      'SELECT * FROM retention_runs WHERE project_id = $1 ORDER BY run_at DESC LIMIT 1',
      [req.params.projectId]
    );

    res.json({
      ...stats,
      retention_days: projectRows[0].retention_days,
      storage_warning_threshold: projectRows[0].storage_warning_threshold,
      storage_warning: isWarning,
      last_cleanup: lastRun[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:projectId/policy', authenticate, async (req, res) => {
  const { retention_days, storage_warning_threshold } = req.body;

  if (retention_days !== null && retention_days !== undefined) {
    if (!VALID_RETENTION_DAYS.includes(retention_days)) {
      return res.status(400).json({
        error: `retention_days must be one of: ${VALID_RETENTION_DAYS.join(', ')} (null = forever)`,
      });
    }
  }

  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const { rows } = await db.query(
      `UPDATE projects SET
         retention_days = $1,
         storage_warning_threshold = COALESCE($2, storage_warning_threshold)
       WHERE id = $3
       RETURNING id, retention_days, storage_warning_threshold`,
      [retention_days ?? null, storage_warning_threshold, req.params.projectId]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:projectId/cleanup', authenticate, async (req, res) => {
  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const result = await runRetentionForProject(req.params.projectId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;