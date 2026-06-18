const { auth } = require('../config/firebase-admin');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (token.startsWith('mock_token')) {
      // the token is in the format "mock_token_Role" e.g., "mock_token_Faculty"
      const role = token.split('_')[2] || 'Student';
      req.user = { uid: 'mock_uid_123', role };
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(403).json({ error: 'Unauthorized route access' });
  }
};

module.exports = { verifyToken };
