const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const { rows: totals } = await db.query(
      `SELECT
         COUNT(DISTINCT p.id)                          as total_projects,
         COUNT(l.id)                                   as total_logs,
         COUNT(l.id) FILTER (WHERE l.level = 'error') as total_errors,
         COUNT(l.id) FILTER (WHERE l.level = 'fatal') as total_fatals,
         COUNT(l.id) FILTER (WHERE l.timestamp >= NOW() - INTERVAL '24 hours') as logs_24h,
         COUNT(l.id) FILTER (WHERE l.level IN ('error','fatal') AND l.timestamp >= NOW() - INTERVAL '24 hours') as errors_24h
       FROM projects p
       LEFT JOIN logs l ON l.project_id = p.id
       WHERE p.user_id = $1`,
      [req.userId]
    );


    const { rows: hourly } = await db.query(
      `SELECT
         DATE_TRUNC('hour', l.timestamp)               as hour,
         COUNT(*)                                       as total,
         COUNT(*) FILTER (WHERE l.level = 'error')     as errors,
         COUNT(*) FILTER (WHERE l.level = 'fatal')     as fatals,
         COUNT(*) FILTER (WHERE l.level = 'warn')      as warns,
         COUNT(*) FILTER (WHERE l.level = 'info')      as infos,
         COUNT(*) FILTER (WHERE l.level = 'debug')     as debugs
       FROM logs l
       JOIN projects p ON p.id = l.project_id
       WHERE p.user_id = $1
         AND l.timestamp >= NOW() - INTERVAL '24 hours'
       GROUP BY DATE_TRUNC('hour', l.timestamp)
       ORDER BY hour ASC`,
      [req.userId]
    );

 
    const { rows: levelDist } = await db.query(
      `SELECT
         l.level,
         COUNT(*) as count
       FROM logs l
       JOIN projects p ON p.id = l.project_id
       WHERE p.user_id = $1
         AND l.timestamp >= NOW() - INTERVAL '7 days'
       GROUP BY l.level
       ORDER BY count DESC`,
      [req.userId]
    );


    const { rows: topProjects } = await db.query(
      `SELECT
         p.name,
         p.id,
         COUNT(l.id)                                       as total_today,
         COUNT(l.id) FILTER (WHERE l.level = 'error')     as errors_today,
         COUNT(l.id) FILTER (WHERE l.level = 'fatal')     as fatals_today
       FROM projects p
       LEFT JOIN logs l
         ON l.project_id = p.id
         AND l.timestamp >= CURRENT_DATE
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY total_today DESC
       LIMIT 5`,
      [req.userId]
    );


    const { rows: anomalyCount } = await db.query(
      `SELECT COUNT(*) as count
       FROM anomalies a
       JOIN projects p ON p.id = a.project_id
       WHERE p.user_id = $1
         AND a.acknowledged = false
         AND a.detected_at >= NOW() - INTERVAL '24 hours'`,
      [req.userId]
    );


    const { rows: alertCount } = await db.query(
      `SELECT COUNT(*) as count
       FROM alert_triggers at
       JOIN projects p ON p.id = at.project_id
       WHERE p.user_id = $1
         AND at.acknowledged = false
         AND at.triggered_at >= NOW() - INTERVAL '24 hours'`,
      [req.userId]
    );

    res.json({
      totals: totals[0],
      hourly,
      levelDistribution: levelDist,
      topProjects,
      openAnomalies: parseInt(anomalyCount[0]?.count || 0),
      openAlerts: parseInt(alertCount[0]?.count || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;