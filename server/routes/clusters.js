const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');
const { getClusters } = require('../services/clusteringService');
const { analyzeCluster } = require('../agents/clusterAnalyzer');

const router = express.Router();


router.get('/:projectId', authenticate, async (req, res) => {
  const { sinceHours = 24, limit = 20 } = req.query;

  try {
    const { rows: projectRows } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const clusters = await getClusters(req.params.projectId, {
      sinceHours: parseInt(sinceHours),
      limit: parseInt(limit),
    });

    res.json(clusters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/:projectId/:clusterId/analyze', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ec.* FROM error_clusters ec
       JOIN projects p ON p.id = ec.project_id
       WHERE ec.id = $1 AND p.id = $2 AND p.user_id = $3`,
      [req.params.clusterId, req.params.projectId, req.userId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Cluster not found' });

    const cluster = rows[0];


    if (cluster.ai_summary) {
      return res.json({
        summary: cluster.ai_summary,
        likely_cause: cluster.ai_likely_cause,
        cached: true,
      });
    }


    const result = await analyzeCluster(cluster);

    if (!result.success) {
      return res.status(500).json({ error: 'Analysis failed' });
    }


    await db.query(
      'UPDATE error_clusters SET ai_summary = $1, ai_likely_cause = $2 WHERE id = $3',
      [result.summary, result.likely_cause, cluster.id]
    );

    res.json({
      summary: result.summary,
      likely_cause: result.likely_cause,
      suggested_action: result.suggested_action,
      cached: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;