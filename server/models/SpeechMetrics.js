const mongoose = require('mongoose');

const SpeechMetricsSchema = new mongoose.Schema({
  averageSpeechRate: Number,
  conversationalSpeechRate: Number,
  longPauses: Number,
  speakingTimePercent: Number,
  pauseDurations: [Number]
}, { _id: false });

module.exports = {
  SpeechMetricsSchema
};