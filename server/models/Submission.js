const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitch: { type: String, required: true }, // Assume this is a video URL or ID
  submittedDate: { type: Date, default: Date.now },
  evaluations: [
    {
      evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      score: { type: Number, required: true },
      feedback: { type: String, required: true },
      evaluatedDate: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Submission', SubmissionSchema);
