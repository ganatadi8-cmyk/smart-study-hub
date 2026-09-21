const { auth } = require('../config/firebase-admin');
const roles = new Set(['Student', 'Faculty', 'Admin']);
const verifyToken = async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Please sign in.' });
  try {
    const token = await auth.verifyIdToken(match[1], true);
    req.user = { ...token, role: roles.has(token.role) ? token.role : 'Student' };
    next();
  } catch {
    res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
  }
};
const requireRoles = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user?.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
  next();
};
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user?.email_verified) return res.status(403).json({ error: 'Verify your email before using this feature.' });
  next();
};
module.exports = { verifyToken, requireRoles, requireVerifiedEmail };
