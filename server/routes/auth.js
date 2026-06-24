const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const redis = require('../db/redis');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Cache TTL: 5 minutes (user data rarely changes within a session)
const ME_CACHE_TTL = 300;
const meKey = (userId) => `me:${userId}`;


router.post('/register', authLimiter, async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email.toLowerCase(), passwordHash, name || null]
    );

    const token = jwt.sign(
      { userId: rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(201).json({
      token,
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await db.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({
      token,
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/logout', (req, res) => {
  // Best-effort: clear /me cache for this user if token is present
  try {
    let token = req.headers['authorization']?.slice(7) || req.cookies?.token;
    if (token) {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      redis.del(meKey(userId)).catch(() => {});
    }
  } catch {
    // ignore — logout should always succeed regardless
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true });
});


/**
 * GET /me — returns the currently authenticated user.
 *
 * Optimisations:
 *  1. JWT is verified synchronously (no I/O) before any async work.
 *  2. User data is cached in Redis (TTL = 5 min) — subsequent calls within
 *     a session are served without a Postgres round-trip.
 *  3. This route is NOT behind authLimiter (it's a read, not a login attempt).
 */
router.get('/me', async (req, res) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = req.cookies?.token;
  }

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try {
    ({ userId } = jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Try Redis cache first
  try {
    const cached = await redis.get(meKey(userId));
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch {
    // Redis miss or error — fall through to DB
  }

  try {
    const { rows } = await db.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });

    // Populate cache for future requests
    redis.set(meKey(userId), JSON.stringify(rows[0]), 'EX', ME_CACHE_TTL).catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;