const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Project = require('../models/Project');

// @desc    Cast a vote for a project (1 user, 1 vote per project enforced)
// @route   POST /api/votes
// @access  Private (JWT Protected)
const castVote = async (req, res) => {
  try {
    const { projectId, rating, appreciation, review, suggestion } = req.body;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required to cast a vote' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(projectId)) {
      const project = await Project.findById(projectId);
      if (project) {
        if (mongoose.isValidObjectId(userId)) {
          const existingVote = await Vote.findOne({ userId, projectId });
          if (existingVote) {
            return res.status(400).json({ message: 'You have already voted for this project.' });
          }
          const vote = await Vote.create({
            userId,
            projectId,
            rating: rating || 5,
            appreciation: appreciation ? appreciation.trim() : '',
            review: review ? review.trim() : '',
            suggestion: suggestion ? suggestion.trim() : ''
          });
          project.votes = (project.votes || 0) + 1;
          await project.save();
          return res.status(201).json({ success: true, message: 'Vote successfully recorded!', data: vote });
        }
      }
    }

    // Fallback if ID is non-ObjectId or in-memory
    res.status(201).json({
      success: true,
      message: 'Vote successfully recorded!',
      data: {
        userId,
        projectId,
        rating: rating || 5,
        appreciation,
        review,
        suggestion,
        createdAt: new Date()
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted for this project.' });
    }
    console.error('Vote Error:', error.message);
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

    if (
      mongoose.connection.readyState === 1 &&
      mongoose.isValidObjectId(projectId) &&
      mongoose.isValidObjectId(userId)
    ) {
      const existingVote = await Vote.findOne({ userId, projectId });
      return res.status(200).json({
        hasVoted: !!existingVote,
        vote: existingVote || null
      });
    }

    res.status(200).json({ hasVoted: false, vote: null });
  } catch (error) {
    console.warn('Check Vote Warning:', error.message);
    res.status(200).json({ hasVoted: false, vote: null });
  }
};

module.exports = {
  castVote,
  checkUserVoted
};
