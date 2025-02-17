const mongoose = require('mongoose');

const WordMetricsSchema = new mongoose.Schema({
  word: String,
  startTime: Number,
  endTime: Number,
  confidence: Number,
  rate: Number
}, { _id: false });

const SpeechMetricsSchema = new mongoose.Schema({
  overallMetrics: {
    averageRate: Number,
    totalWords: Number,
    totalDuration: Number
  },
  thresholds: {
    slow: Number,
    optimal: Number,
    fast: Number
  },
  wordLevelMetrics: [WordMetricsSchema]
}, { _id: false });

module.exports = {
  SpeechMetricsSchema
};