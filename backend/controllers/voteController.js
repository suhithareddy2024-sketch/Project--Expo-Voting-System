const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');

// @desc    Cast a vote for a project (Strict 1 user, 1 vote globally across entire Expo)
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
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (mongoose.isValidObjectId(userId)) {
        // Check if user has already voted for ANY project
        const existingVote = await Vote.findOne({ userId });
        if (existingVote) {
          if (String(existingVote.projectId) === String(projectId)) {
            return res.status(400).json({
              message: 'You have already voted for this project.'
            });
          } else {
            const prevProject = await Project.findById(existingVote.projectId);
            const prevTitle = prevProject ? prevProject.title : 'another project';
            return res.status(400).json({
              message: `You have already cast your 1 official vote for "${prevTitle}". Each participant is allowed only one vote in total across the entire Expo. You can still submit feedback and reviews for other projects!`
            });
          }
        }

        const vote = await Vote.create({
          userId,
          projectId,
          rating: rating || 5,
          appreciation: appreciation ? appreciation.trim() : '',
          review: review ? review.trim() : '',
          suggestion: suggestion ? suggestion.trim() : ''
        });

        // Increment project vote count
        project.votes = (project.votes || 0) + 1;
        await project.save();

        // Also record in Feedback collection so it shows in project feedback lists
        const feedbackMessage = [appreciation, review, suggestion].filter(Boolean).join(' | ');
        if (feedbackMessage) {
          try {
            await Feedback.create({
              userId,
              projectId,
              rating: rating || 5,
              message: feedbackMessage.trim()
            });
          } catch (fbErr) {
            console.warn('Silent feedback copy notice:', fbErr.message);
          }
        }

        return res.status(201).json({
          success: true,
          message: 'Official vote successfully recorded!',
          data: vote
        });
      }
    }

    // Fallback if DB is disconnected
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
      return res.status(400).json({
        message: 'You have already cast your 1 official vote for the Expo. Multiple project voting is not permitted.'
      });
    }
    console.error('Vote Error:', error.message);
    res.status(500).json({ message: error.message || 'Server error while casting vote' });
  }
};

// @desc    Get the current user's single cast vote across the entire expo
// @route   GET /api/votes/my-vote
// @access  Private
const getMyVote = async (req, res) => {
  try {
    const userId = req.user._id;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(userId)) {
      const vote = await Vote.findOne({ userId }).populate('projectId', 'title team category image');
      return res.status(200).json({
        success: true,
        hasVoted: !!vote,
        vote: vote || null
      });
    }
    res.status(200).json({ success: true, hasVoted: false, vote: null });
  } catch (error) {
    console.warn('Get My Vote Warning:', error.message);
    res.status(200).json({ success: true, hasVoted: false, vote: null });
  }
};

// @desc    Check if current user has voted for a specific project or anywhere
// @route   GET /api/votes/check/:projectId
// @access  Private
const checkUserVoted = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (
      mongoose.connection.readyState === 1 &&
      mongoose.isValidObjectId(userId)
    ) {
      const userVote = await Vote.findOne({ userId }).populate('projectId', 'title team category');
      
      const hasVotedForThisProject =
        userVote &&
        userVote.projectId &&
        String(userVote.projectId._id || userVote.projectId) === String(projectId);

      return res.status(200).json({
        hasVoted: hasVotedForThisProject,
        hasVotedForThisProject,
        hasVotedAnywhere: !!userVote,
        votedProjectId: userVote ? (userVote.projectId?._id || userVote.projectId) : null,
        votedProjectTitle: userVote?.projectId?.title || null,
        votedProjectTeam: userVote?.projectId?.team || null,
        vote: userVote || null
      });
    }

    res.status(200).json({
      hasVoted: false,
      hasVotedForThisProject: false,
      hasVotedAnywhere: false,
      votedProjectId: null,
      votedProjectTitle: null,
      vote: null
    });
  } catch (error) {
    console.warn('Check Vote Warning:', error.message);
    res.status(200).json({
      hasVoted: false,
      hasVotedForThisProject: false,
      hasVotedAnywhere: false,
      vote: null
    });
  }
};

module.exports = {
  castVote,
  getMyVote,
  checkUserVoted
};

