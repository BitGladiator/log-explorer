const express = require("express");
const authenticate = require("../middleware/authenticate");
const db = require("../db");

const router = express.Router();

router.get("/:projectId", authenticate, async (req, res) => {
  const { limit = 30 } = req.query;
  try {
    const { rows: projectRows } = await db.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [req.params.projectId, req.userId]
    );
    if (!projectRows[0])
      return res.status(404).json({ error: "Project not found" });

    const { rows } = await db.query(
      `SELECT * FROM anomalies WHERE project_id = $1 ORDER BY detected_at DESC LIMIT $2`,
      [req.params.projectId, parseInt(limit)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:projectId/:anomalyId/ack", authenticate, async (req, res) => {
  try {
    await db.query(
      "UPDATE anomalies SET acknowledged = true WHERE id = $1 AND project_id = $2",
      [req.params.anomalyId, req.params.projectId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
