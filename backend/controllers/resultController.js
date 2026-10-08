const Project = require('../models/Project');
const Vote = require('../models/Vote');
const Feedback = require('../models/Feedback');

const mongoose = require('mongoose');
const fallbackProjects = require('../data/fallbackProjects.json');

const isDbReady = () => mongoose.connection.readyState === 1;

// @desc    Get overall voting results & leaderboard
// @route   GET /api/results
// @access  Public
const getAllResults = async (req, res) => {
  try {
    if (!isDbReady()) {
      const sorted = [...fallbackProjects].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const top3 = sorted.slice(0, 3).map((p, idx) => ({
        rank: idx + 1,
        id: p._id || p.id,
        title: p.title,
        category: p.category,
        team: p.team,
        votes: p.votes || 0
      }));

      return res.status(200).json({
        success: true,
        stats: {
          totalProjects: sorted.length,
          totalVotes: sorted.reduce((sum, p) => sum + (p.votes || 0), 0),
          totalFeedback: 12
        },
        top3,
        leaderboard: sorted.map((p, index) => ({
          rank: index + 1,
          id: p._id || p.id,
          title: p.title,
          category: p.category,
          team: p.team,
          votes: p.votes || 0,
          image: p.image
        }))
      });
    }

    const projects = await Project.find({}).sort({ votes: -1, createdAt: 1 });
    const totalVotes = await Vote.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    // Top 3 Podium
    const top3 = projects.slice(0, 3).map((p, idx) => ({
      rank: idx + 1,
      id: p._id,
      title: p.title,
      category: p.category,
      team: p.team,
      votes: p.votes || 0
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalProjects: projects.length,
        totalVotes,
        totalFeedback
      },
      top3,
      leaderboard: projects.map((p, index) => ({
        rank: index + 1,
        id: p._id,
        title: p.title,
        category: p.category,
        team: p.team,
        votes: p.votes || 0,
        image: p.image
      }))
    });
  } catch (error) {
    console.error('Results Error:', error);
    const sorted = [...fallbackProjects].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    res.status(200).json({
      success: true,
      stats: {
        totalProjects: sorted.length,
        totalVotes: sorted.reduce((sum, p) => sum + (p.votes || 0), 0),
        totalFeedback: 0
      },
      top3: sorted.slice(0, 3).map((p, idx) => ({
        rank: idx + 1,
        id: p._id || p.id,
        title: p.title,
        category: p.category,
        team: p.team,
        votes: p.votes || 0
      })),
      leaderboard: sorted.map((p, index) => ({
        rank: index + 1,
        id: p._id || p.id,
        title: p.title,
        category: p.category,
        team: p.team,
        votes: p.votes || 0,
        image: p.image
      }))
    });
  }
};

// @desc    Get results for a specific project
// @route   GET /api/results/:projectId
// @access  Public
const getProjectResult = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const feedbacks = await Feedback.find({ projectId }).populate('userId', 'name email');
    const votes = await Vote.find({ projectId });

    // Calculate average rating
    const avgRating =
      votes.length > 0
        ? (votes.reduce((acc, v) => acc + (v.rating || 5), 0) / votes.length).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          title: project.title,
          category: project.category,
          team: project.team,
          totalVotes: project.votes || 0,
          averageRating: Number(avgRating)
        },
        votesCount: votes.length,
        feedbackCount: feedbacks.length,
        feedbackList: feedbacks
      }
    });
  } catch (error) {
    console.error('Project Result Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found with provided ID' });
    }
    res.status(500).json({ message: 'Server error retrieving project results' });
  }
};

module.exports = {
  getAllResults,
  getProjectResult
};
