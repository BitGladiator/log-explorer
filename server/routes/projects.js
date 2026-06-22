const express = require("express");
const authenticate = require("../middleware/authenticate");
const db = require("../db");
const { generateApiKey } = require("../services/logService");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*,
         COALESCE(s.logs_ingested, 0) as logs_today,
         COUNT(l.id) as total_logs
       FROM projects p
       LEFT JOIN ingestion_stats s
         ON s.project_id = p.id AND s.date = CURRENT_DATE
       LEFT JOIN logs l ON l.project_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id, s.logs_ingested
       ORDER BY p.created_at DESC`,
      [req.userId]
    );

    const projectsWithWarning = rows.map((p) => ({
      ...p,
      storage_warning:
        parseInt(p.total_logs) >= parseInt(p.storage_warning_threshold),
    }));

    res.json(projectsWithWarning);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
  const apiKey = generateApiKey();

  try {
    const { rows } = await db.query(
      `INSERT INTO projects (user_id, name, slug, api_key)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, name, slug, apiKey]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Project name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/rotate-key", authenticate, async (req, res) => {
  const newKey = generateApiKey();

  try {
    const { rows } = await db.query(
      `UPDATE projects SET api_key = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, api_key`,
      [newKey, req.params.id, req.userId]
    );

    if (!rows[0]) return res.status(404).json({ error: "Project not found" });
    const redis = require("../db/redis");
    const oldKey = rows[0].api_key;
    await redis.del(`apikey:${oldKey}`);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
