const Project = require('../models/Project');
const Vote = require('../models/Vote');
const Feedback = require('../models/Feedback');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found with provided ID' });
    }
    res.status(500).json({ message: 'Server error fetching project details' });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const { title, category, team, image, description, longDescription, members, highlights } = req.body;

    if (!title || !category || !team || !description) {
      return res.status(400).json({
        message: 'Please provide all required fields (title, category, team, description)'
      });
    }

    const project = await Project.create({
      title,
      category,
      team,
      image,
      description,
      longDescription,
      members: members || [],
      highlights: highlights || []
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating project' });
  }
};

// @desc    Update existing project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Update Project Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found with provided ID' });
    }
    res.status(500).json({ message: error.message || 'Server error updating project' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.id);
    // Also clean up votes and feedback associated with this project
    await Vote.deleteMany({ projectId: req.params.id });
    await Feedback.deleteMany({ projectId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Project and its associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete Project Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found with provided ID' });
    }
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
