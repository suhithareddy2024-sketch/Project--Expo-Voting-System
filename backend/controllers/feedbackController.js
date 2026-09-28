const Feedback = require('../models/Feedback');
const Project = require('../models/Project');

// @desc    Submit project feedback
// @route   POST /api/feedback
// @access  Private (JWT Protected)
const submitFeedback = async (req, res) => {
  try {
    const { projectId, rating, message, appreciation, review, suggestion } = req.body;
    // Strictly identify user from JWT
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const feedbackMessage =
      message ||
      [appreciation, review, suggestion].filter(Boolean).join(' | ');

    if (!feedbackMessage || !feedbackMessage.trim()) {
      return res.status(400).json({
        message: 'Please provide a feedback message'
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const feedback = await Feedback.create({
      userId,
      projectId,
      rating: rating || 5,
      message: feedbackMessage.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Feedback Error:', error);
    res.status(500).json({ message: error.message || 'Server error submitting feedback' });
  }
};

// @desc    Get all feedback reviews for a specific project
// @route   GET /api/feedback/:projectId
// @access  Public
const getFeedbackByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const feedbacks = await Feedback.find({ projectId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error('Get Feedback Error:', error);
    res.status(500).json({ message: 'Server error retrieving feedback' });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackByProject
};
