const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedbackByProject
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

// Feedback routes
router.post('/', protect, submitFeedback);
router.get('/:projectId', getFeedbackByProject);

module.exports = router;
