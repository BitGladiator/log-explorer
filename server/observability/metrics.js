const promClient = require('prom-client');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({
  register,
  prefix: 'logexplorer_',
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const logsIngestedTotal = new promClient.Counter({
  name: 'logs_ingested_total',
  help: 'Total logs ingested',
  labelNames: ['project_id', 'level'],
  registers: [register],
});

const logIngestionDuration = new promClient.Histogram({
  name: 'log_ingestion_duration_seconds',
  help: 'Time to ingest a batch of logs',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const logsBatchSize = new promClient.Histogram({
  name: 'logs_batch_size',
  help: 'Number of logs per ingestion batch',
  buckets: [1, 5, 10, 50, 100, 500, 1000],
  registers: [register],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Active WebSocket connections',
  registers: [register],
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'DB query duration',
  labelNames: ['query_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  logsIngestedTotal,
  logIngestionDuration,
  logsBatchSize,
  activeConnections,
  dbQueryDuration,
};