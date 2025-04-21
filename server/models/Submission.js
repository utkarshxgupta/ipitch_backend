const mongoose = require('mongoose');
const { SpeechMetricsSchema } = require('./SpeechMetrics');

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
  speechMetrics: {
    type: SpeechMetricsSchema,
    default: null
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
  ],
  automaticEvaluation: {
    score: { type: Number },
    details: [{
      keyword: { type: String },
      matched: { type: Boolean },
      matchedSentence: { type: String },
      similarity: { type: Number },
      weight: { type: Number },
      score: { type: Number }
    }],
    rawScore: { type: Number },
    maxPossibleScore: { type: Number },
    minPossibleScore: { type: Number },
    evaluatedAt: { type: Date },
    semanticSimilarity: {
      score: { type: Number },
      similarity: { type: Number }
    }
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
