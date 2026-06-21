const db = require('../db');
const logger = require('../observability/logger');

const computeCurrentWindow = async (projectId, windowMinutes = 5) => {
  const { rows } = await db.query(
    `SELECT
       level,
       service,
       DATE_TRUNC('minute', timestamp) as minute
     FROM logs
     WHERE project_id = $1
       AND timestamp >= NOW() - INTERVAL '1 minute' * $2`,
    [projectId, windowMinutes]
  );

  if (rows.length === 0) return null;


  const minuteCounts = {};
  const levelCounts = {};
  const services = new Set();

  rows.forEach((row) => {
    const key = row.minute.toISOString();
    minuteCounts[key] = (minuteCounts[key] || 0) + 1;
    levelCounts[row.level] = (levelCounts[row.level] || 0) + 1;
    if (row.service) services.add(row.service);
  });

  const counts = Object.values(minuteCounts);
  const avg = counts.reduce((s, c) => s + c, 0) / counts.length;
  const variance = counts.reduce((s, c) => s + (c - avg) ** 2, 0) / counts.length;
  const stddev = Math.sqrt(variance);

  const total = rows.length;
  const distribution = {};
  Object.entries(levelCounts).forEach(([level, count]) => {
    distribution[level] = count / total;
  });

  return {
    avgLogsPerMinute: avg,
    stddevLogsPerMinute: stddev,
    levelDistribution: distribution,
    services: [...services],
    totalLogs: total,
  };
};


const updateBaseline = async (projectId) => {

  const current = await computeCurrentWindow(projectId, 60);
  if (!current) return null;

  const { rows: existing } = await db.query(
    'SELECT * FROM project_baselines WHERE project_id = $1',
    [projectId]
  );

  const ALPHA = 0.3; 

  if (!existing[0]) {
    await db.query(
      `INSERT INTO project_baselines
         (project_id, avg_logs_per_minute, stddev_logs_per_minute,
          level_distribution, known_services, sample_count)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [
        projectId, current.avgLogsPerMinute, current.stddevLogsPerMinute,
        JSON.stringify(current.levelDistribution), JSON.stringify(current.services),
      ]
    );
    return current;
  }

  const prev = existing[0];
  const newAvg = ALPHA * current.avgLogsPerMinute + (1 - ALPHA) * parseFloat(prev.avg_logs_per_minute);
  const newStddev = ALPHA * current.stddevLogsPerMinute + (1 - ALPHA) * parseFloat(prev.stddev_logs_per_minute);

  const prevDist = prev.level_distribution || {};
  const newDist = {};
  const allLevels = new Set([...Object.keys(prevDist), ...Object.keys(current.levelDistribution)]);
  allLevels.forEach((level) => {
    const prevVal = prevDist[level] || 0;
    const curVal = current.levelDistribution[level] || 0;
    newDist[level] = ALPHA * curVal + (1 - ALPHA) * prevVal;
  });

  const knownServices = new Set([...(prev.known_services || []), ...current.services]);

  await db.query(
    `UPDATE project_baselines SET
       avg_logs_per_minute = $1,
       stddev_logs_per_minute = $2,
       level_distribution = $3,
       known_services = $4,
       sample_count = sample_count + 1,
       updated_at = NOW()
     WHERE project_id = $5`,
    [newAvg, newStddev, JSON.stringify(newDist), JSON.stringify([...knownServices]), projectId]
  );

  return { ...current, baseline: { avgLogsPerMinute: newAvg, stddevLogsPerMinute: newStddev, levelDistribution: newDist, knownServices: [...knownServices] } };
};

module.exports = { computeCurrentWindow, updateBaseline };