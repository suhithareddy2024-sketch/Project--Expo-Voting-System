const express = require('express');
const router = express.Router();
const { castVote, getMyVote, checkUserVoted } = require('../controllers/voteController');
const { protect } = require('../middleware/authMiddleware');

// Protected voting routes
router.post('/', protect, castVote);
router.get('/my-vote', protect, getMyVote);
router.get('/check/:projectId', protect, checkUserVoted);

module.exports = router;

