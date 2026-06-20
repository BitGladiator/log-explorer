const db = require('../db');
const logger = require('../observability/logger');


const checkThresholdRule = async (rule) => {
  const conditions = ['project_id = $1', "timestamp >= NOW() - INTERVAL '1 minute' * $2"];
  const params = [rule.project_id, rule.window_minutes];
  let paramIndex = 3;

  if (rule.level) {
    conditions.push(`level = $${paramIndex++}`);
    params.push(rule.level);
  } else if (rule.rule_type === 'error_rate') {
    conditions.push(`level IN ('error', 'fatal')`);
  }

  if (rule.service) {
    conditions.push(`service = $${paramIndex++}`);
    params.push(rule.service);
  }

  const where = conditions.join(' AND ');

  const { rows } = await db.query(
    `SELECT id, level, message, service, timestamp
     FROM logs
     WHERE ${where}
     ORDER BY timestamp DESC
     LIMIT 5`,
    params
  );

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) as count FROM logs WHERE ${where}`,
    params
  );

  const count = parseInt(countRows[0].count);

  return { triggered: count >= rule.threshold_count, count, sampleLogs: rows };
};


const checkKeywordRule = async (rule) => {
  const conditions = [
    'project_id = $1',
    "timestamp >= NOW() - INTERVAL '1 minute' * $2",
    `search_vector @@ plainto_tsquery('english', $3)`,
  ];
  const params = [rule.project_id, rule.window_minutes, rule.keyword];

  if (rule.service) {
    conditions.push(`service = $4`);
    params.push(rule.service);
  }

  const where = conditions.join(' AND ');

  const { rows } = await db.query(
    `SELECT id, level, message, service, timestamp
     FROM logs
     WHERE ${where}
     ORDER BY timestamp DESC
     LIMIT 5`,
    params
  );

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) as count FROM logs WHERE ${where}`,
    params
  );

  const count = parseInt(countRows[0].count);

  return { triggered: count >= rule.threshold_count, count, sampleLogs: rows };
};


const isInCooldown = async (ruleId, cooldownMinutes = 15) => {
  const { rows } = await db.query(
    `SELECT id FROM alert_triggers
     WHERE alert_rule_id = $1
       AND triggered_at >= NOW() - INTERVAL '1 minute' * $2
     LIMIT 1`,
    [ruleId, cooldownMinutes]
  );
  return rows.length > 0;
};

const sendSlackAlert = async (webhookUrl, rule, result) => {
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*Log Explorer Alert: ${rule.name}*`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${rule.name}* triggered\n${result.count} matching logs in the last ${rule.window_minutes} minutes (threshold: ${rule.threshold_count})`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: result.sampleLogs
                .map((l) => `\`${l.level}\` ${l.message}`)
                .join('\n'),
            },
          },
        ],
      }),
    });
  } catch (err) {
    logger.error('Slack alert delivery failed', { error: err.message });
  }
};


const checkAllAlertRules = async (io) => {
  const { rows: rules } = await db.query(
    'SELECT * FROM alert_rules WHERE enabled = true'
  );

  logger.debug('Checking alert rules', { count: rules.length });

  for (const rule of rules) {
    try {
      const inCooldown = await isInCooldown(rule.id);
      if (inCooldown) continue;

      const result = rule.rule_type === 'keyword_match'
        ? await checkKeywordRule(rule)
        : await checkThresholdRule(rule);

      if (!result.triggered) continue;


      const { rows: triggerRows } = await db.query(
        `INSERT INTO alert_triggers (alert_rule_id, project_id, matched_count, sample_logs)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [rule.id, rule.project_id, result.count, JSON.stringify(result.sampleLogs)]
      );

      logger.info('Alert triggered', {
        ruleId: rule.id,
        ruleName: rule.name,
        count: result.count,
        threshold: rule.threshold_count,
      });


      await sendSlackAlert(rule.slack_webhook_url, rule, result);


      if (io) {
        io.to(`project:${rule.project_id}`).emit('alert_triggered', {
          rule: { id: rule.id, name: rule.name },
          trigger: triggerRows[0],
        });
      }
    } catch (err) {
      logger.error('Alert rule check failed', { ruleId: rule.id, error: err.message });
    }
  }
};

module.exports = { checkAllAlertRules };