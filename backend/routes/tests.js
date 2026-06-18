const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getTests, submitTest } = require('../controllers/testController');

router.get('/', getTests);
router.post('/:testId/submit', verifyToken, submitTest);

module.exports = router;
