const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserProfile, getAllUsers, deleteUser, getLeaderboard } = require('../controllers/userController');
router.use(verifyToken);
router.get('/leaderboard', getLeaderboard);
router.get('/profile', getUserProfile);
router.get('/', getAllUsers);
router.delete('/:id', deleteUser);
module.exports = router;
