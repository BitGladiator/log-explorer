const { v4: uuidv4 } = require('uuid');
const { httpRequestDuration, httpRequestTotal } = require('../observability/metrics');
const logger = require('../observability/logger');

const requestMetrics = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;

    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path.replace(/\/\d+/g, '/:id');

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    httpRequestDuration.observe(labels, durationSec);
    httpRequestTotal.inc(labels);

    logger.info('Request', {
      requestId: req.id,
      method: req.method,
      route,
      status: res.statusCode,
      durationMs: Math.round(durationSec * 1000),
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestMetrics;