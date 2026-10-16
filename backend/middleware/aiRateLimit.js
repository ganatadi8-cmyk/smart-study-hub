const { db } = require('../config/database');
const { createHash } = require('node:crypto');
// Shared Neon PostgreSQL counters work across restarts and multiple API instances.
const aiRateLimit = async (req, res, next) => {
  const windowMs = 60 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const uid = createHash('sha256').update(req.user.uid).digest('hex');
  const limit = Number(process.env.AI_REQUESTS_PER_HOUR || 20);
  const globalLimit = Number(process.env.AI_GLOBAL_REQUESTS_PER_HOUR || 200);
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(globalLimit) || globalLimit < 1) {
    return res.status(503).json({ error: 'AI usage limits are not configured correctly.' });
  }
  try {
    const allowed = await db.runTransaction(async tx => {
      const refs = [db.collection('rateLimits').doc(`ai_${uid}`), db.collection('rateLimits').doc('ai_global')];
      const snapshots = await Promise.all(refs.map(ref => tx.get(ref)));
      const counts = snapshots.map(snap => snap.exists && snap.data().window === window ? snap.data().count : 0);
      if (counts[0] >= limit || counts[1] >= globalLimit) return false;
      refs.forEach((ref, i) => tx.set(ref, { window, count: counts[i] + 1 }));
      return true;
    });
    if (!allowed) {
      res.set('Retry-After', String(Math.ceil(((window + 1) * windowMs - Date.now()) / 1000)));
      return res.status(429).json({ error: 'AI usage limit reached. Please try again later.' });
    }
    next();
  } catch {
    res.status(503).json({ error: 'AI usage checking is unavailable. Please try again later.' });
  }
};
module.exports = { aiRateLimit };
