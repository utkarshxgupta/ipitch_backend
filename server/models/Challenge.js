const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  prompts: { type: [String], default: [] },
  idealPitch: { type: String, default: '' },  // Assume this is a Video URL or ID
  evaluationCriteria: { type: [String], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
