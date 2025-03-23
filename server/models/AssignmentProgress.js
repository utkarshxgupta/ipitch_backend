const mongoose = require('mongoose');

const ChallengeProgressSchema = new mongoose.Schema({
  challenge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Challenge', 
    required: true 
  },
  bestSubmission: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Submission' 
  },
  bestScore: { 
    type: Number, 
    default: 0 
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  lastAttemptDate: { 
    type: Date 
  }
}, { _id: false });

const AssignmentProgressSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: true 
  },
  challengeProgress: [ChallengeProgressSchema],
  overallScore: { 
    type: Number, 
    default: 0 
  },
  completedChallenges: { 
    type: Number, 
    default: 0 
  },
  totalChallenges: { 
    type: Number, 
    default: 0 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

// Create compound index for efficient queries
AssignmentProgressSchema.index({ user: 1, assignment: 1 }, { unique: true });
AssignmentProgressSchema.index({ assignment: 1 });

module.exports = mongoose.model('AssignmentProgress', AssignmentProgressSchema);