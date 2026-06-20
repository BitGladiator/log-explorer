const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();


router.get('/:projectId/rules', authenticate, async (req, res) => {
  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const { rows } = await db.query(
      'SELECT * FROM alert_rules WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/:projectId/rules', authenticate, async (req, res) => {
  const {
    name, rule_type, level, threshold_count,
    window_minutes, keyword, service, slack_webhook_url,
  } = req.body;

  if (!name || !rule_type || !threshold_count) {
    return res.status(400).json({ error: 'name, rule_type and threshold_count are required' });
  }

  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const { rows } = await db.query(
      `INSERT INTO alert_rules
         (project_id, name, rule_type, level, threshold_count,
          window_minutes, keyword, service, slack_webhook_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.params.projectId, name, rule_type, level || null,
        threshold_count, window_minutes || 5, keyword || null,
        service || null, slack_webhook_url || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:projectId/rules/:ruleId', authenticate, async (req, res) => {
  const {
    name, threshold_count, window_minutes,
    keyword, service, enabled, slack_webhook_url,
  } = req.body;

  try {
    const { rows } = await db.query(
      `UPDATE alert_rules SET
         name = COALESCE($1, name),
         threshold_count = COALESCE($2, threshold_count),
         window_minutes = COALESCE($3, window_minutes),
         keyword = COALESCE($4, keyword),
         service = COALESCE($5, service),
         enabled = COALESCE($6, enabled),
         slack_webhook_url = COALESCE($7, slack_webhook_url)
       WHERE id = $8 AND project_id = $9
       RETURNING *`,
      [
        name, threshold_count, window_minutes, keyword,
        service, enabled, slack_webhook_url,
        req.params.ruleId, req.params.projectId,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Rule not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:projectId/rules/:ruleId', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM alert_rules WHERE id = $1 AND project_id = $2',
      [req.params.ruleId, req.params.projectId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:projectId/triggers', authenticate, async (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT at.*, ar.name as rule_name, ar.rule_type
       FROM alert_triggers at
       JOIN alert_rules ar ON ar.id = at.alert_rule_id
       WHERE at.project_id = $1
       ORDER BY at.triggered_at DESC
       LIMIT $2`,
      [req.params.projectId, parseInt(limit)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:projectId/triggers/:triggerId/ack', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE alert_triggers SET acknowledged = true WHERE id = $1 AND project_id = $2',
      [req.params.triggerId, req.params.projectId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;