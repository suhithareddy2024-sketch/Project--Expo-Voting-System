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

    // Aggregate live vote counts directly from Vote collection
    const voteCounts = await Vote.aggregate([
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    const voteMap = {};
    voteCounts.forEach((v) => {
      voteMap[String(v._id)] = v.count;
    });

    const projects = await Project.find({});
    const totalVotes = await Vote.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    // Map projects with exact live vote count
    const enriched = projects.map((p) => {
      const obj = p.toObject();
      const actualVotes = voteMap[String(p._id)] !== undefined ? voteMap[String(p._id)] : 0;
      return {
        ...obj,
        id: p._id,
        _id: p._id,
        votes: actualVotes
      };
    });

    // Sort strictly by votes descending, then team number/createdAt
    enriched.sort((a, b) => {
      if ((b.votes || 0) !== (a.votes || 0)) {
        return (b.votes || 0) - (a.votes || 0);
      }
      return Number(a.team || 0) - Number(b.team || 0);
    });

    // Top 3 Podium
    const top3 = enriched.slice(0, 3).map((p, idx) => ({
      rank: idx + 1,
      id: p._id,
      title: p.title,
      category: p.category,
      team: p.team,
      votes: p.votes || 0,
      image: p.image
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalProjects: projects.length,
        totalVotes,
        totalFeedback
      },
      top3,
      leaderboard: enriched.map((p, index) => ({
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
