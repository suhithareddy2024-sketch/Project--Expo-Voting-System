const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String, required: true },
    icon: { type: String, default: 'bi bi-cpu' },
    color: { type: String, default: 'text-cyan' }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please provide a category/domain'],
      trim: true
    },
    team: {
      type: String,
      required: [true, 'Please provide a team or project number'],
      trim: true
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    },
    description: {
      type: String,
      required: [true, 'Please provide a short description'],
      trim: true
    },
    longDescription: {
      type: String,
      trim: true
    },
    members: {
      type: [String],
      default: []
    },
    highlights: {
      type: [highlightSchema],
      default: []
    },
    votes: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Project', projectSchema);
