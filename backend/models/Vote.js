const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    appreciation: {
      type: String,
      trim: true
    },
    review: {
      type: String,
      trim: true
    },
    suggestion: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Enforce 1 User, 1 Vote overall across the entire Expo with a Unique Index on userId
voteSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
