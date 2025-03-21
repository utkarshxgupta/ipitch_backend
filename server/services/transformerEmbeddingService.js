const { pipeline, env, AutoTokenizer, AutoModel } = require('@xenova/transformers');
const logger = require('../utils/logger');

class TransformerEmbeddingService {
  constructor() {
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
    this.embeddingDimension = 384;
    this.ready = false;
    this.modelLoadFailed = false;
    this.embeddingPipeline = null;
    this.modelLoading = null;
    
    // Configure environment
    env.cacheDir = './transformer-cache';
    env.allowLocalModels = false;
  }

  /**
   * Initializes the service by preloading the model
   * Should be called at server startup
   */
  async initialize() {
    try {
      logger.info(`Preloading embedding model: ${this.modelName}`);
      this.embeddingPipeline = await pipeline('feature-extraction', this.modelName);
      this.ready = true;
      logger.info('Embedding model initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to preload embedding model: ${error.message}`, error);
      this.modelLoadFailed = true;
      return false;
    }
  }

  /**
   * Generate embeddings for a given text
   * @param {string} text - The input text to generate embeddings for
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async getEmbeddings(text) {
    // Check if model failed to load completely
    if (this.modelLoadFailed) {
      logger.warn('Using zero vector as embedding - model previously failed to load');
      return new Array(this.embeddingDimension).fill(0);
    }
    
    // Make sure the model is ready
    if (!this.ready) {
      await this.waitForReady();
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
      logger.warn('Empty or invalid text provided for embedding generation');
      return new Array(this.embeddingDimension).fill(0);
    }

    try {
      // Get embeddings using the pipeline
      const result = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the embedding vector from the result
      // The result is a 3D array [batch, tokens, features]
      // With pooling='mean', we get a 2D array [batch, features]
      return Array.from(result.data);
    } catch (error) {
      logger.error(`Error generating embeddings: ${error.message}`, error);
      // Return zero vector as fallback
      return new Array(this.embeddingDimension).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   * @param {number[]} embeddings1 - First embedding vector
   * @param {number[]} embeddings2 - Second embedding vector
   * @returns {number} - Similarity score between -1 and 1
   */
  calculateCosineSimilarity(embeddings1, embeddings2) {
    if (!embeddings1 || !embeddings2 || embeddings1.length !== embeddings2.length) {
      logger.warn('Invalid embedding vectors provided for similarity calculation');
      return 0;
    }

    try {
      // Calculate dot product
      const dotProduct = embeddings1.reduce((sum, val, i) => sum + val * embeddings2[i], 0);
      
      // Calculate magnitudes
      const magnitude1 = Math.sqrt(embeddings1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(embeddings2.reduce((sum, val) => sum + val * val, 0));
      
      // Handle zero vectors
      if (magnitude1 === 0 || magnitude2 === 0) return 0;
      
      // Calculate cosine similarity
      return dotProduct / (magnitude1 * magnitude2);
    } catch (error) {
      logger.error(`Error calculating cosine similarity: ${error.message}`);
      return 0;
    }
  }

  /**
   * Wait for model to be ready
   * @returns {Promise<void>}
   */
  async waitForReady() {
    if (this.ready) return;

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.ready) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Segment text into sentences for individual processing
   * @param {string} text - The text to segment
   * @returns {string[]} - Array of sentences
   */
  segmentIntoSentences(text) {
    if (!text) return [];
    
    // Simple sentence splitting (can be enhanced)
    return text
      .replace(/([.?!])\s+/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Create text windows using sliding window approach
   * @param {string} text - The input text
   * @param {number} windowSize - Number of words per window
   * @param {number} stride - Number of words to slide the window
   * @returns {Array<{text: string, startIndex: number, endIndex: number}>}
   */
  createTextWindows(text, windowSize = 25, stride = 12) {
    if (!text) return [];
    
    // Split text into words
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length === 0) return [];
    
    const windows = [];
    
    // Create sliding windows
    for (let i = 0; i < words.length; i += stride) {
      if (i + windowSize > words.length) {
        // Last window might be smaller than windowSize
        const windowText = words.slice(i).join(' ');
        windows.push({
          text: windowText,
          startIndex: i,
          endIndex: words.length - 1
        });
        break;
      }
      
      const windowText = words.slice(i, i + windowSize).join(' ');
      windows.push({
        text: windowText,
        startIndex: i,
        endIndex: i + windowSize - 1
      });
    }
    
    return windows;
  }

  /**
   * Find semantic matches between a query text and criteria
   * @param {string} text - The text to analyze
   * @param {Array} criteria - Array of criteria objects with keywords, weights, and embeddings
   * @param {number} similarityThreshold - Threshold for considering a match
   * @returns {Promise<Object>} - Detailed results with scores
   */
  async findSemanticMatches(text, criteria, similarityThreshold = 0.70) {
    // Use sliding windows instead of sentences
    const windows = this.createTextWindows(text);
    if (!windows.length || !criteria?.length) {
      return { 
        score: 0, 
        matches: [], 
        maxPossibleScore: 0,
        normalizedScore: 0 
      };
    }

    // Generate embeddings for each window in the text
    const windowEmbeddings = await Promise.all(
      windows.map(async window => ({
        text: window.text,
        startIndex: window.startIndex,
        endIndex: window.endIndex,
        embedding: await this.getEmbeddings(window.text)
      }))
    );

    // Track matches and score
    let totalScore = 0;
    let maxPossiblePositiveScore = 0;
    let maxPossibleNegativeScore = 0;
    const matches = [];

    // Check each criterion against all windows
    for (const criterion of criteria) {
      const { keyword, weight, embeddings } = criterion;
      
      if (!embeddings) {
        logger.warn(`Missing embeddings for criterion: ${keyword}`);
        continue;
      }

      // Track the best match for this criterion
      let bestMatch = null;
      let highestSimilarity = -1;

      // Compare with each window
      for (const windowObj of windowEmbeddings) {
        const similarity = this.calculateCosineSimilarity(
          embeddings, 
          windowObj.embedding
        );

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = {
            criterion: keyword,
            // Add ellipsis to indicate excerpt
            sentence: `...${windowObj.text}...`,
            similarity: similarity,
            weight: weight
          };
        }
      }

      // If we have a match above threshold
      if (bestMatch && bestMatch.similarity >= similarityThreshold) {
        // Calculate score contribution based on weight
        const scoreContribution = bestMatch.weight;
        totalScore += scoreContribution;
        
        // Track match details
        matches.push({
          ...bestMatch,
          matched: true,
          scoreContribution
        });
      } else {
        // If no match found, there's a "negative match" for positive criteria
        // and a "positive match" for negative criteria
        const scoreContribution = weight < 0 ? Math.abs(weight) : -Math.abs(weight)/2;
        totalScore += scoreContribution;
        
        matches.push({
          criterion: keyword,
          sentence: null,
          similarity: bestMatch ? bestMatch.similarity : 0,
          weight,
          matched: false,
          scoreContribution
        });
      }

      // Track potential scores for normalization
      if (weight > 0) {
        maxPossiblePositiveScore += weight;
      } else {
        maxPossibleNegativeScore += Math.abs(weight);
      }
    }

    // Calculate maximum possible score range
    const maxPossibleScore = maxPossiblePositiveScore + maxPossibleNegativeScore;
    
    // Normalize score to 0-100 range
    const normalizedScore = maxPossibleScore === 0 
      ? 50 // Default to middle when no criteria
      : Math.max(0, Math.min(100, ((totalScore + maxPossibleNegativeScore) / maxPossibleScore) * 100));

    return {
      score: Math.round(normalizedScore),
      rawScore: totalScore,
      matches,
      maxPossibleScore,
      positiveMaxScore: maxPossiblePositiveScore,
      negativeMaxScore: maxPossibleNegativeScore
    };
  }
}

module.exports = new TransformerEmbeddingService();