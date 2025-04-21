const TransformerEmbeddingService = require('./transformerEmbeddingService');
const logger = require('../utils/logger');

class SemanticEvaluationService {
  /**
   * Evaluate a transcript against criteria using semantic matching
   * @param {string} transcript - The transcript to evaluate
   * @param {Array} evaluationCriteria - Array of criteria with keywords, weights, and embeddings
   * @returns {Promise<Object>} - Evaluation results with score and details
   */
  async evaluateTranscript(transcript, evaluationCriteria) {
    try {
      logger.info('Starting semantic evaluation of transcript');
      
      if (!transcript || !evaluationCriteria?.length) {
        logger.warn('Cannot evaluate: Missing transcript or evaluation criteria');
        return {
          score: 0,
          details: [],
          rawScore: 0,
          maxPossibleScore: 0
        };
      }

      // Perform semantic matching between transcript and criteria
      const evaluationResult = await TransformerEmbeddingService.findSemanticMatches(
        transcript,
        evaluationCriteria,
        0.65 // Similarity threshold
      );

      logger.info(`Semantic evaluation complete. Score: ${evaluationResult.score}`);
      
      // Format details for storage
      const details = evaluationResult.matches.map(match => ({
        keyword: match.criterion,
        matched: match.matched,
        matchedSentence: match.sentence,
        similarity: parseFloat(match.similarity.toFixed(4)),
        weight: match.weight,
        score: match.scoreContribution
      }));

      return {
        score: evaluationResult.score,
        details,
        rawScore: evaluationResult.rawScore,
        maxPossibleScore: evaluationResult.maxPossibleScore,
        minPossibleScore: evaluationResult.minPossibleScore
      };
    } catch (error) {
      logger.error(`Error during semantic evaluation: ${error.message}`, error);
      return {
        score: 0,
        details: [],
        rawScore: 0,
        maxPossibleScore: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate similarity between submission transcript and ideal pitch
   * @param {string} transcript - Submission transcript
   * @param {Array} idealPitchEmbeddings - Pre-computed embeddings of ideal pitch
   * @returns {Promise<Object>} - Similarity results
   */
  async calculateIdealPitchSimilarity(transcript, idealPitchEmbeddings) {
    try {
      if (!transcript || !idealPitchEmbeddings?.length) {
        return { score: 0, similarity: 0 };
      }
      
      // Generate embeddings for transcript
      const transcriptEmbeddings = await TransformerEmbeddingService.getEmbeddings(transcript);
      
      // Calculate similarity
      const similarity = TransformerEmbeddingService.calculateCosineSimilarity(
        transcriptEmbeddings,
        idealPitchEmbeddings
      );
      
      // Convert similarity to score (0-100)
      const score = Math.round(((similarity + 1) / 2) * 100);
      
      return {
        score,
        similarity: parseFloat(similarity.toFixed(4))
      };
    } catch (error) {
      logger.error(`Error calculating ideal pitch similarity: ${error.message}`, error);
      return { score: 0, similarity: 0 };
    }
  }
}

module.exports = new SemanticEvaluationService();