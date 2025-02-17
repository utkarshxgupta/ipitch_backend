const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

class EvaluationService {
  evaluateTranscript(transcript, evaluationCriteria) {
    // Normalize transcript and tokenize
    const tokens = tokenizer.tokenize(transcript.toLowerCase());
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    const detailedResults = [];

    evaluationCriteria.forEach(criteria => {
      const keyword = criteria.keyword.toLowerCase();
      const weight = criteria.weight;
      
      // Count keyword occurrences
      const occurrences = tokens.filter(token => token === keyword).length;
      
      // Calculate score for this keyword
      const keywordScore = occurrences * weight;
      
      // Track maximum possible positive score
      maxPossibleScore += Math.abs(weight) * 2; // Multiplied by 2 as a reasonable expected maximum
      
      detailedResults.push({
        keyword,
        occurrences,
        weight,
        score: keywordScore
      });
      
      totalScore += keywordScore;
    });

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(100, Math.max(0, 
      ((totalScore + maxPossibleScore) / (maxPossibleScore * 2)) * 100
    ));

    return {
      score: Math.round(normalizedScore),
      details: detailedResults,
      rawScore: totalScore,
      maxPossibleScore
    };
  }
}

module.exports = new EvaluationService();