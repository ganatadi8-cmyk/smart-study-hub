const express = require('express');
const router = express.Router();
const { verifyToken, requireRoles } = require('../middleware/authMiddleware');
const { getTests, submitTest } = require('../controllers/testController');

router.get('/', getTests);
router.post('/:testId/submit', verifyToken, requireRoles('Student'), submitTest);

module.exports = router;
