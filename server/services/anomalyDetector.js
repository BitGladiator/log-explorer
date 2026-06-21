const db = require("../db");
const { computeCurrentWindow, updateBaseline } = require("./baselineService");
const logger = require("../observability/logger");

const Z_SCORE_THRESHOLD = 2.5;
const MIN_SAMPLES_FOR_DETECTION = 5;

const detectAnomalies = async (projectId) => {
  const { rows: baselineRows } = await db.query(
    "SELECT * FROM project_baselines WHERE project_id = $1",
    [projectId]
  );

  const baseline = baselineRows[0];
  const current = await computeCurrentWindow(projectId);

  await updateBaseline(projectId);

  if (
    !baseline ||
    !current ||
    baseline.sample_count < MIN_SAMPLES_FOR_DETECTION
  ) {
    return [];
  }

  const anomalies = [];
  const avgBaseline = parseFloat(baseline.avg_logs_per_minute);
  const stddevBaseline = parseFloat(baseline.stddev_logs_per_minute) || 1;

  const zScore = (current.avgLogsPerMinute - avgBaseline) / stddevBaseline;

  if (zScore > Z_SCORE_THRESHOLD) {
    anomalies.push({
      type: "volume_spike",
      severity: zScore > 4 ? "high" : "medium",
      description: `Log volume is ${current.avgLogsPerMinute.toFixed(
        1
      )}/min, well above the typical ${avgBaseline.toFixed(1)}/min`,
      metricValue: current.avgLogsPerMinute,
      baselineValue: avgBaseline,
    });
  } else if (zScore < -Z_SCORE_THRESHOLD && avgBaseline > 1) {
    anomalies.push({
      type: "volume_drop",
      severity: "medium",
      description: `Log volume dropped to ${current.avgLogsPerMinute.toFixed(
        1
      )}/min from a typical ${avgBaseline.toFixed(
        1
      )}/min — service may be down`,
      metricValue: current.avgLogsPerMinute,
      baselineValue: avgBaseline,
    });
  }

  const knownServices = new Set(baseline.known_services || []);
  const newServices = current.services.filter((s) => !knownServices.has(s));
  if (newServices.length > 0 && knownServices.size > 0) {
    anomalies.push({
      type: "new_service",
      severity: "low",
      description: `New service${
        newServices.length > 1 ? "s" : ""
      } appeared in logs: ${newServices.join(", ")}`,
      metricValue: newServices.length,
      baselineValue: knownServices.size,
    });
  }

  const baselineDist = baseline.level_distribution || {};
  const baselineErrorRate =
    (baselineDist.error || 0) + (baselineDist.fatal || 0);
  const currentErrorRate =
    (current.levelDistribution.error || 0) +
    (current.levelDistribution.fatal || 0);

  if (currentErrorRate > baselineErrorRate + 0.15 && currentErrorRate > 0.1) {
    anomalies.push({
      type: "level_shift",
      severity: currentErrorRate > 0.4 ? "high" : "medium",
      description: `Error rate is ${(currentErrorRate * 100).toFixed(
        0
      )}% of logs, up from a typical ${(baselineErrorRate * 100).toFixed(0)}%`,
      metricValue: currentErrorRate,
      baselineValue: baselineErrorRate,
    });
  }

  return anomalies;
};

module.exports = { detectAnomalies, Z_SCORE_THRESHOLD };
