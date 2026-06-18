const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserProfile, getAllUsers, deleteUser, getLeaderboard } = require('../controllers/userController');

// Mock routes to fulfill API structure requirements
router.post('/signup', async (req, res) => {
  res.json({ message: 'Signup via API handled here. (Client SDK handles primary auth)' });
});

router.post('/login', async (req, res) => {
  res.json({ message: 'Login via API handled here. (Client SDK handles primary auth)' });
});

router.get('/leaderboard', verifyToken, getLeaderboard);
router.get('/profile', verifyToken, getUserProfile);
router.get('/', verifyToken, getAllUsers);
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;
