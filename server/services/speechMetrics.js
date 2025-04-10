/**
 * Constants for speech rate analysis specific to sales pitch evaluation
 */
const SPEECH_RATE_CONSTANTS = {
  WORDS_PER_MINUTE: {
    SLOW: 120,    // Minimum acceptable rate for professional speech
    OPTIMAL: 150,  // Ideal rate for sales pitch delivery
    FAST: 180     // Maximum acceptable rate for clarity
  },
  CONVERSATIONAL_RATE: 150, // Average conversational speaking rate
  PAUSE_THRESHOLD: 0.5,     // Pause threshold in seconds (500ms)
  LONG_PAUSE_THRESHOLD: 2.0, // Long pause threshold in seconds (2s)
  WINDOW_SIZE: 30,          // 30-second windows for analysis
  MIN_WORD_DURATION: 0.1    // 100ms minimum for valid word
};

/**
 * Calculates speaking rate metrics for a single word
 * @param {Object} word - Word object with timing and confidence info
 * @returns {Object} Enhanced word metrics
 */
function calculateSpeakingRate(word) {
  const duration = word.endTime - word.startTime;
  
  if (!word.word || duration < SPEECH_RATE_CONSTANTS.MIN_WORD_DURATION) {
    return null;
  }

  const rate = 60 / duration; // Words per minute for this word

  return {
    word: word.word,
    startTime: word.startTime,
    endTime: word.endTime,
    confidence: word.confidence,
    rate: parseFloat(rate.toFixed(2))
  };
}

/**
 * Identifies pauses between words
 * @param {Array} words - Array of word objects
 * @returns {Array} Array of pause durations in seconds
 */
function identifyPauses(words) {
  if (!words || words.length < 2) {
    return [];
  }

  const pauseDurations = [];
  
  for (let i = 1; i < words.length; i++) {
    const pauseDuration = words[i].startTime - words[i-1].endTime;
    if (pauseDuration >= SPEECH_RATE_CONSTANTS.PAUSE_THRESHOLD) {
      pauseDurations.push(parseFloat(pauseDuration.toFixed(2)));
    }
  }
  
  return pauseDurations;
}

/**
 * Calculates comprehensive speaking rate metrics
 * @param {Array} words - Array of word objects
 * @returns {Object} Detailed speaking rate analysis matching SpeechMetricsSchema
 */
function calculateAverageSpeakingRate(words) {
  if (!words?.length) {
    return {
      averageSpeechRate: 0,
      conversationalSpeechRate: 0,
      longPauses: 0,
      speakingTimePercent: 0,
      pauseDurations: []
    };
  }

  // Calculate total duration
  const totalDuration = words[words.length - 1].endTime - words[0].startTime;
  
  // Calculate speaking time
  const speakingTime = words.reduce((sum, word) => sum + (word.endTime - word.startTime), 0);
  
  // Calculate pauses
  const pauseDurations = identifyPauses(words);
  
  // Count long pauses
  const longPauses = pauseDurations.filter(duration => 
    duration >= SPEECH_RATE_CONSTANTS.LONG_PAUSE_THRESHOLD
  ).length;
  
  // Calculate speaking time percentage
  const speakingTimePercent = parseFloat(((speakingTime / totalDuration) * 100).toFixed(2));
  
  // Calculate average speech rate (words per minute)
  const averageSpeechRate = parseFloat((words.length * 60 / totalDuration).toFixed(2));
  
  // Calculate conversational speech rate score (how close to conversational rate)
  const deviation = Math.abs(averageSpeechRate - SPEECH_RATE_CONSTANTS.CONVERSATIONAL_RATE);
  const maxDeviation = 100; // Maximum reasonable deviation
  const conversationalSpeechRate = parseFloat(
    Math.max(0, 1 - (deviation / maxDeviation)).toFixed(2)
  );

  return {
    averageSpeechRate,
    conversationalSpeechRate,
    longPauses,
    speakingTimePercent,
    pauseDurations
  };
}

module.exports = {
  calculateSpeakingRate,
  calculateAverageSpeakingRate,
  SPEECH_RATE_CONSTANTS
};