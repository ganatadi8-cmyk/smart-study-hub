const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getDiscussions, postDiscussion, replyToDiscussion } = require('../controllers/discussionController');

router.get('/', getDiscussions);
router.post('/', verifyToken, postDiscussion);
router.post('/:id/reply', verifyToken, replyToDiscussion);

module.exports = router;
