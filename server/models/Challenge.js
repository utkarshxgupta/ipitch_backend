const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  idealPitch: { type: String, default: '' },
  idealPitchEmbeddings: { type: [Number], default: null },
  evaluationCriteria: [{
    keyword: { type: String, required: true },
    weight: { type: Number, required: true },
    embeddings: { type: [Number], default: null }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
