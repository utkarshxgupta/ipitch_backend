/**
 * Constants for speech rate analysis specific to sales pitch evaluation
 */
const SPEECH_RATE_CONSTANTS = {
  WORDS_PER_MINUTE: {
    SLOW: 120,    // Minimum acceptable rate for professional speech
    OPTIMAL: 150,  // Ideal rate for sales pitch delivery
    FAST: 180     // Maximum acceptable rate for clarity
  },
  WINDOW_SIZE: 30,        // 30-second windows for analysis
  MIN_WORD_DURATION: 0.1  // 100ms minimum for valid word
};

/**
 * Calculates speaking rate metrics for a single word
 * @param {Object} word - Word object with timing and confidence info
 * @returns {Object} Enhanced word metrics
 */
function calculateSpeakingRate(word) {
  console.log(word);
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
 * Calculates comprehensive speaking rate metrics
 * @param {Array} words - Array of word objects
 * @returns {Object} Detailed speaking rate analysis
 */
function calculateAverageSpeakingRate(words) {
  if (!words?.length) {
    return createEmptyMetrics();
  }

  const windows = groupIntoTimeWindows(words, SPEECH_RATE_CONSTANTS.WINDOW_SIZE);
  const windowAnalysis = calculateWindowMetrics(windows);
  const averageRate = calculateOverallRate(windowAnalysis);

  return {
    averageRate: parseFloat(averageRate.toFixed(2)),
    totalWords: words.length,
    totalDuration: parseFloat((words[words.length - 1].endTime - words[0].startTime).toFixed(2))
  };
}

/**
 * Groups words into time-based windows
 * @param {Array} words - Array of word objects
 * @param {number} windowSize - Window size in seconds
 * @returns {Array} Arrays of words grouped by time windows
 */
function groupIntoTimeWindows(words, windowSize) {
  if (!words || words.length === 0) {
    return [];
  }

  const windows = [];
  let currentWindow = {
    words: [],
    startTime: words[0].startTime,
    endTime: null
  };

  words.forEach(word => {
    if (word.startTime - currentWindow.startTime >= windowSize) {
      // Finalize current window
      currentWindow.endTime = currentWindow.words[currentWindow.words.length - 1].endTime;
      windows.push(currentWindow);
      
      // Start new window
      currentWindow = {
        words: [word],
        startTime: word.startTime,
        endTime: null
      };
    } else {
      currentWindow.words.push(word);
    }
  });

  // Add the last window if it has words
  if (currentWindow.words.length > 0) {
    currentWindow.endTime = currentWindow.words[currentWindow.words.length - 1].endTime;
    windows.push(currentWindow);
  }

  return windows;
}

/**
 * Calculates metrics for each time window
 * @param {Array} windows - Array of word groups by time window
 * @returns {Array} Window-level metrics
 */
function calculateWindowMetrics(windows) {
  return windows.map(window => {
    // Ensure startTime and endTime are numbers
    const startTime = typeof window.startTime === 'number' ? 
      window.startTime : 
      window.words[0].startTime;
    
    const endTime = typeof window.endTime === 'number' ? 
      window.endTime : 
      window.words[window.words.length - 1].endTime;

    const duration = endTime - startTime;
    const rate = (window.words.length * 60) / duration;

    return {
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(endTime.toFixed(2)),
      rate: parseFloat(rate.toFixed(2)),
      wordsInWindow: window.words.length,
      isFast: rate > SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST,
      isSlow: rate < SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW,
      isOptimal: rate >= SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW && 
                 rate <= SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST
    };
  });
}

/**
 * Creates empty metrics object for null cases
 * @returns {Object} Empty metrics structure
 */
function createEmptyMetrics() {
  return {
    averageRate: 0,
    totalWords: 0,
    totalDuration: 0
  };
}

/**
 * Calculates overall speaking rate
 * @param {Array} windowAnalysis - Array of window metrics
 * @returns {number} Average speaking rate
 */
function calculateOverallRate(windowAnalysis) {
  return windowAnalysis.reduce((sum, w) => sum + w.rate, 0) / windowAnalysis.length;
}

module.exports = {
  calculateSpeakingRate,
  calculateAverageSpeakingRate,
  SPEECH_RATE_CONSTANTS
};