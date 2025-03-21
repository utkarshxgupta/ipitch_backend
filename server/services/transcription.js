const speech = require('@google-cloud/speech').v2;
const fs = require('fs');
const { promisify } = require('util');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const logger = require('../utils/logger');
const os = require('os');
const Submission = require('../models/Submission');
const evaluationService = require('./evaluationService');
const embeddingService = require('./embeddingService');
const Challenge = require('../models/Challenge');

/**
 * Service for transcribing audio from video files using Google Speech-to-Text v2
 */
class TranscriptionService {
  constructor() {
    try {
      // Initialize speech client with application credentials
      this.client = new speech.SpeechClient();
      
      // Set up project details for v2 API
      this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      this.location = 'global'; // Using global for better model availability
      
      // Update configuration for longer audio and Indian English
      this.recognitionConfig = {
        autoDecodingConfig: {},
        languageCodes: ['en-IN'], // Changed to Indian English
        model: 'long', // Using 'long' model instead of 'latest_short'
        features: {
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
          enableSpokenPunctuation: true,
          enableSpokenEmojis: false,
          enableAutomaticPunctuation: true, // Added for better readability
        }
      };
    } catch (error) {
      logger.error('Failed to initialize Speech-to-Text client:', error);
      throw error;
    }
  }

  /**
   * Extract audio from a video file
   * @param {string} videoPath Path to the video file
   * @returns {Promise<string>} Path to extracted audio file
   */
  async extractAudioFromVideo(videoPath) {
    try {
      const audioPath = videoPath.replace(/\.[^/.]+$/, '.wav');
      
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .output(audioPath)
          .audioCodec('pcm_s16le')
          .audioChannels(1)
          .audioFrequency(16000)
          .on('end', () => resolve(audioPath))
          .on('error', reject)
          .run();
      });
    } catch (error) {
      logger.error(`Error extracting audio from video: ${error.message}`);
      throw new Error(`Failed to extract audio: ${error.message}`);
    }
  }

  /**
   * Transcribe audio file using Google Speech-to-Text v2 asynchronously
   * @param {string} audioPath Path to audio file
   * @returns {Promise<Object>} Transcription results formatted for evaluation service
   */
  async transcribeAudio(audioPath) {
    try {
      // Create a unique filename for GCS storage
      const fileName = `audio-transcription-${Date.now()}-${path.basename(audioPath)}`;
      
      // Upload the audio file to GCS using StorageService
      const storageService = require('./storage');
      const fileBuffer = await promisify(fs.readFile)(audioPath);
      const uploadResult = await storageService.uploadAudioFile({
        buffer: fileBuffer,
        originalname: path.basename(audioPath),
        mimetype: 'audio/wav'
      }, 'transcription-temp');
      
      // Get GCS URI
      const audioGcsUri = `gs://${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${uploadResult.fileName}`;
      logger.info(`Uploaded audio to GCS: ${audioGcsUri}`);
      
      // Create recognition config with proper parent path for v2 API
      const parent = `projects/${this.projectId}/locations/${this.location}`;
      
      // Create a recognizer ID that follows Google's requirements
      // Must match regex: [a-z]([a-z0-9-]{0,61}[a-z0-9])?
      const timestamp = Date.now().toString();
      const recognizerId = `recognizer-${timestamp.substring(timestamp.length - 10)}`;
      const recognizerPath = `${parent}/recognizers/${recognizerId}`;
      
      // Define formattedResults in the outer scope so it's available for return
      let formattedResults = { transcript: '', words: [], confidence: 0 };
      
      try {
        // Create a recognizer (one-time setup)
        const createRecognizerRequest = {
          parent,
          recognizerId,
          recognizer: {
            defaultRecognitionConfig: this.recognitionConfig,
            languageCodes: ['en-IN'],
            model: 'long'
          }
        };
        
        logger.info(`Creating temporary recognizer: ${recognizerId}`);
        await this.client.createRecognizer(createRecognizerRequest);
        
        // Use batchRecognize method with GCS URI
        const batchRecognizeRequest = {
          recognizer: recognizerPath,
          config: this.recognitionConfig,
          files: [{
            uri: audioGcsUri // Use GCS URI instead of base64 content
          }],
          recognitionOutputConfig: {
            // Inline results instead of writing to GCS
            inlineResponseConfig: {}
          }
        };

        logger.info(`Starting batch asynchronous file transcription using GCS URI`);
        const [operation] = await this.client.batchRecognize(batchRecognizeRequest);

        // For batch operations, we need to check status and wait for completion
        logger.info('Waiting for transcription to complete...');

        // Log the operation for debugging
        logger.info(`Operation details: ${JSON.stringify(operation.name || 'No name available')}`);

        // Use the operation's promise-based interface instead of polling
        try {
          logger.info('Waiting for operation to complete...');
          const [response] = await operation.promise();
          logger.info('Transcription completed');
          // logger.info(`Operation response: ${JSON.stringify(response)}`);
          formattedResults = this.formatTranscriptionResults(response);
          logger.info(`Formatted results: ${JSON.stringify(formattedResults)}`);
        } catch (operationError) {
          logger.error(`Operation failed: ${operationError.message}`);
          throw operationError;
        }

        // Clean up the temporary recognizer
        await this.client.deleteRecognizer({ name: recognizerPath });
        
        // Delete the temporary audio file from GCS
        try {
          await storageService.deleteFile(uploadResult.fileName);
          logger.info(`Deleted temporary audio file from GCS: ${uploadResult.fileName}`);
        } catch (cleanupError) {
          logger.warn(`Failed to delete temporary audio file from GCS: ${cleanupError.message}`);
        }
        
        return formattedResults;
      } catch (error) {
        // If we created a recognizer but encountered an error, try to clean it up
        try {
          await this.client.deleteRecognizer({ name: recognizerPath });
        } catch (cleanupError) {
          logger.warn(`Failed to clean up temporary recognizer: ${cleanupError.message}`);
        }
        
        // Also try to delete the temporary GCS file
        try {
          await storageService.deleteFile(uploadResult.fileName);
        } catch (cleanupError) {
          logger.warn(`Failed to delete temporary audio file from GCS: ${cleanupError.message}`);
        }
        
        throw error;
      }
    } catch (error) {
      logger.error(`Transcription failed: ${error.message}`);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Format transcription results for evaluation service
   * @param {Object} response Raw response from Speech-to-Text v2 API
   * @returns {Object} Formatted results
   */
  formatTranscriptionResults(response) {
    // Check if we have a valid response
    if (!response || !response.results) {
      return { transcript: '', words: [], confidence: 0 };
    }
    
    // Extract results from the new API response structure
    let results = [];
    
    // Check if results come from inlineResult
    if (response.inlineResult && response.inlineResult.transcript && response.inlineResult.transcript.results) {
      results = response.inlineResult.transcript.results;
    }
    // Or check for the first file result
    else {
      // Look for the first file key in the results object
      const firstFileKey = Object.keys(response.results)[0];
      if (firstFileKey && response.results[firstFileKey].transcript) {
        results = response.results[firstFileKey].transcript.results || [];
      }
    }
    
    if (!results || !results.length) {
      return { transcript: '', words: [], confidence: 0 };
    }
    
    // Extract full transcript
    const transcript = results
      .map(result => result.alternatives && result.alternatives[0] ? result.alternatives[0].transcript : '')
      .join(' ')
      .trim();
    
    // Extract word-level details
    const words = [];
    results.forEach(result => {
      if (result.alternatives && result.alternatives[0] && result.alternatives[0].words) {
        result.alternatives[0].words.forEach(word => {
          words.push({
            word: word.word,
            startTime: this.formatTimeOffset(word.startOffset),
            endTime: this.formatTimeOffset(word.endOffset),
            confidence: word.confidence || 0
          });
        });
      }
    });
    
    // Calculate overall confidence score (average of all word confidences)
    const confidence = words.length > 0 
      ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length
      : 0;
    
    return {
      transcript,
      words,
      confidence,
      languageCode: results[0]?.languageCode || this.recognitionConfig.languageCodes[0]
    };
  }

  /**
   * Format time offset from Speech-to-Text API v2 to seconds
   * @param {Object} offset Time offset object with seconds and nanos
   * @returns {number} Time in seconds
   */
  formatTimeOffset(offset) {
    if (!offset) return 0;
    
    // Convert seconds and nanos to a floating point number
    const seconds = parseInt(offset.seconds || 0);
    const nanos = parseInt(offset.nanos || 0);
    
    return seconds + (nanos / 1e9);
  }

  /**
   * Create a temporary file from a buffer
   * @param {Buffer} buffer File buffer
   * @param {string} filename Original filename
   * @returns {Promise<string>} Path to temporary file
   */
  async createTempFileFromBuffer(buffer, filename) {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${filename}`);
    
    await promisify(fs.writeFile)(tempFilePath, buffer);
    return tempFilePath;
  }

  /**
   * Clean up temporary files
   * @param {Array<string>} filePaths Array of file paths to delete
   */
  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await promisify(fs.unlink)(filePath);
      } catch (error) {
        logger.warn(`Failed to delete temporary file ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Main transcription method for processing video files from buffer
   * @param {Buffer} videoBuffer Video file buffer
   * @param {string} filename Original filename
   * @param {string} submissionId Submission ID to update with results
   */
  async transcribeVideo(videoBuffer, filename, submissionId) {
    const tempFiles = [];
    
    try {
      // Update submission status to processing
      await Submission.findByIdAndUpdate(submissionId, { 
        transcriptionStatus: 'processing'
      });
      
      // Create temporary video file from buffer
      logger.info(`Creating temporary file for video: ${filename}`);
      const videoPath = await this.createTempFileFromBuffer(videoBuffer, filename);
      tempFiles.push(videoPath);
      
      // Extract audio from video
      logger.info(`Extracting audio from video: ${filename}`);
      const audioPath = await this.extractAudioFromVideo(videoPath);
      tempFiles.push(audioPath);
      
      // Transcribe the extracted audio
      logger.info(`Transcribing audio for video: ${filename}`);
      const transcriptionResults = await this.transcribeAudio(audioPath);
      
      // Get the challenge details for evaluation
      const submission = await Submission.findById(submissionId)
        .populate('challenge');
      
      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }
      
      const challenge = submission.challenge;
      
      // Calculate speech metrics using the word-level data
      logger.info(`Calculating speech metrics for submission: ${submissionId}`);
      const speechMetricsService = require('./speechMetrics');
      
      // Process word-level metrics
      const wordLevelMetrics = transcriptionResults.words
        .map(word => speechMetricsService.calculateSpeakingRate(word))
        .filter(metric => metric !== null);
      
      // Calculate overall metrics
      const overallMetrics = speechMetricsService.calculateAverageSpeakingRate(transcriptionResults.words);
      
      // Create complete speech metrics object
      const speechMetrics = {
        overallMetrics,
        thresholds: {
          slow: speechMetricsService.SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW,
          optimal: speechMetricsService.SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.OPTIMAL,
          fast: speechMetricsService.SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST
        },
        wordLevelMetrics
      };
      
      // Update submission with transcript and speech metrics
      await Submission.findByIdAndUpdate(submissionId, {
        transcript: transcriptionResults.transcript,
        transcriptionStatus: 'completed',
        speechMetrics: speechMetrics
      });
      
      // Perform automatic evaluation if criteria exists
      if (challenge && challenge.evaluationCriteria && challenge.evaluationCriteria.length > 0) {
        logger.info(`Performing automatic evaluation for submission: ${submissionId}`);
        
        // Import semantic evaluation service
        const semanticEvaluationService = require('./semanticEvaluationService');
        
        // Semantic evaluation of criteria
        const evaluationResults = await semanticEvaluationService.evaluateTranscript(
          transcriptionResults.transcript, 
          challenge.evaluationCriteria
        );
        
        // Semantic similarity evaluation with ideal pitch
        let semanticSimilarity = { score: 0, similarity: 0 };
        if (challenge.idealPitchEmbeddings && challenge.idealPitchEmbeddings.length > 0) {
          logger.info(`Calculating semantic similarity for submission: ${submissionId}`);
          semanticSimilarity = await semanticEvaluationService.calculateIdealPitchSimilarity(
            transcriptionResults.transcript,
            challenge.idealPitchEmbeddings
          );
        }
        
        // Update submission with evaluation results
        await Submission.findByIdAndUpdate(submissionId, {
          'automaticEvaluation.score': evaluationResults.score,
          'automaticEvaluation.details': evaluationResults.details,
          'automaticEvaluation.rawScore': evaluationResults.rawScore,
          'automaticEvaluation.maxPossibleScore': evaluationResults.maxPossibleScore,
          'automaticEvaluation.evaluatedAt': new Date(),
          'automaticEvaluation.semanticSimilarity': semanticSimilarity
        });
      }
      
      logger.info(`Completed processing for submission: ${submissionId}`);
    } catch (error) {
      logger.error(`Video transcription failed: ${error.message}`);
      
      // Update submission status to failed
      await Submission.findByIdAndUpdate(submissionId, {
        transcriptionStatus: 'failed'
      });
    } finally {
      // Clean up temporary files
      await this.cleanupTempFiles(tempFiles);
    }
  }
}

module.exports = new TranscriptionService();
