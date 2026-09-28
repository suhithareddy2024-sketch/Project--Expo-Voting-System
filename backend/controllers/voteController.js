const Vote = require('../models/Vote');
const Project = require('../models/Project');

// @desc    Cast a vote for a project (1 user, 1 vote per project enforced)
// @route   POST /api/votes
// @access  Private (JWT Protected)
const castVote = async (req, res) => {
  try {
    const { projectId, rating, appreciation, review, suggestion } = req.body;
    // Strictly identify voter from JWT, never from request body
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required to cast a vote' });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has already voted for this project in MongoDB
    const existingVote = await Vote.findOne({ userId, projectId });
    if (existingVote) {
      return res.status(400).json({
        message: 'You have already voted for this project.'
      });
    }

    // Create new vote document
    const vote = await Vote.create({
      userId,
      projectId,
      rating: rating || 5,
      appreciation: appreciation ? appreciation.trim() : '',
      review: review ? review.trim() : '',
      suggestion: suggestion ? suggestion.trim() : ''
    });

    // Increment project total votes count
    project.votes = (project.votes || 0) + 1;
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Vote successfully recorded!',
      data: vote
    });
  } catch (error) {
    // Handle MongoDB duplicate compound key error code 11000
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already voted for this project.'
      });
    }
    console.error('Vote Error:', error);
    res.status(500).json({ message: error.message || 'Server error while casting vote' });
  }
};

// @desc    Check if current user has voted for a specific project
// @route   GET /api/votes/check/:projectId
// @access  Private
const checkUserVoted = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const existingVote = await Vote.findOne({ userId, projectId });
    res.status(200).json({
      hasVoted: !!existingVote,
      vote: existingVote || null
    });
  } catch (error) {
    console.error('Check Vote Error:', error);
    res.status(500).json({ message: 'Server error checking vote status' });
  }
};

module.exports = {
  castVote,
  checkUserVoted
};
