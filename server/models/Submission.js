const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitch: { type: String, required: true },  // URL of the video in Google Cloud Storage
  videoFileName: { type: String, required: true }, // Original file name
  transcript: { type: String },  // Transcript of the video
  transcriptionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  submittedDate: { type: Date, default: Date.now },
  evaluations: [
    {
      evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      score: { type: Number, required: true },
      feedback: { type: String, required: true },
      evaluatedDate: { type: Date, default: Date.now }
    }
  ],
  comments: [
    {
      commenter: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
      },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('Submission', SubmissionSchema);
