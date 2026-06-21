const db = require("../db");
const { detectAnomalies } = require("./anomalyDetector");
const { explainAnomaly } = require("../agents/anomalyExplainer");
const logger = require("../observability/logger");

const getSampleLogsForAnomaly = async (projectId, anomalyType) => {
  let query = `SELECT level, message, service, timestamp FROM logs WHERE project_id = $1`;
  if (anomalyType === "level_shift" || anomalyType === "volume_spike") {
    query += ` AND level IN ('error', 'fatal')`;
  }
  query += ` ORDER BY timestamp DESC LIMIT 5`;

  const { rows } = await db.query(query, [projectId]);
  return rows;
};

const runAnomalyCheck = async (projectId, io) => {
  const anomalies = await detectAnomalies(projectId);
  if (anomalies.length === 0) return;

  logger.info("Anomalies detected", { projectId, count: anomalies.length });

  for (const anomaly of anomalies) {

    const { rows: recent } = await db.query(
      `SELECT id FROM anomalies
       WHERE project_id = $1 AND anomaly_type = $2
         AND detected_at >= NOW() - INTERVAL '5 minutes'
       LIMIT 1`,
      [projectId, anomaly.type]
    );
    if (recent.length > 0) continue;

    const sampleLogs = await getSampleLogsForAnomaly(projectId, anomaly.type);

    let aiExplanation = null;
    let suggestedAction = null;

    if (anomaly.severity !== "low") {
      const result = await explainAnomaly(anomaly, sampleLogs);
      if (result.success) {
        aiExplanation = result.explanation;
        suggestedAction = result.suggested_action;
      }
    }

    const { rows } = await db.query(
      `INSERT INTO anomalies
         (project_id, anomaly_type, severity, description,
          metric_value, baseline_value, ai_explanation, sample_logs)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        projectId,
        anomaly.type,
        anomaly.severity,
        anomaly.description,
        anomaly.metricValue,
        anomaly.baselineValue,
        aiExplanation
          ? `${aiExplanation}${suggestedAction ? " → " + suggestedAction : ""}`
          : null,
        JSON.stringify(sampleLogs),
      ]
    );

    if (io) {
      io.to(`project:${projectId}`).emit("anomaly_detected", rows[0]);
    }
  }

};

const runAnomalyDetectionForAllProjects = async (io) => {
  const { rows: activeProjects } = await db.query(
    `SELECT DISTINCT project_id FROM logs
     WHERE timestamp >= NOW() - INTERVAL '10 minutes'`
  );

  logger.debug("Running anomaly detection", {
    projectCount: activeProjects.length,
  });

  for (const { project_id } of activeProjects) {
    try {
      await runAnomalyCheck(project_id, io);
    } catch (err) {
      logger.error("Anomaly check failed for project", {
        projectId: project_id,
        error: err.message,
      });
    }
  }
};

module.exports = { runAnomalyDetectionForAllProjects };
