const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../db/redis');

const redisPrefix = process.env.REDIS_PREFIX || '';

const makeStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `${redisPrefix}${prefix}`,
  });

const isDev = process.env.NODE_ENV === 'development';


const normalizeIp = (ip = '') => ip.replace(/^::ffff:/, '');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:global:'),
  message: { error: 'Too many requests' },
  skip: (req) => isDev || req.path === '/api/health',
  // Suppress the IPv6 key-generator validation warning; we normalise below.
  validate: { xForwardedForHeader: false },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: makeStore('rl:auth:'),
  message: { error: 'Too many auth attempts' },
  skip: () => isDev,
  validate: { xForwardedForHeader: false },
});

const ingestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  store: makeStore('rl:ingest:'),

  keyGenerator: (req) => req.headers['x-api-key'] || normalizeIp(req.ip),
  message: { error: 'Ingestion rate limit exceeded' },
  skip: () => isDev,
  validate: { xForwardedForHeader: false },
});

module.exports = { globalLimiter, authLimiter, ingestionLimiter };