const speech = require("@google-cloud/speech").v1;
const { Storage } = require("@google-cloud/storage");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Submission = require('../models/Submission'); // Ensure you import the model
const { 
  calculateSpeakingRate, 
  calculateAverageSpeakingRate, 
  SPEECH_RATE_CONSTANTS 
} = require('./speechMetrics');
const evaluationService = require('./evaluationService');
const Challenge = require('../models/Challenge');

class TranscriptionService {
  constructor() {
    this.speechClient = new speech.SpeechClient();
    this.storage = new Storage();
    this.bucket = this.storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
  }

  async convertVideoToAudio(videoBuffer, originalFileName) {
    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(
      tempDir,
      `${Date.now()}-${originalFileName}`
    );
    const tempAudioPath = path.join(tempDir, `${Date.now()}-audio.wav`);

    try {
      // Write video buffer to temporary file
      fs.writeFileSync(tempVideoPath, videoBuffer);

      // Convert video to audio
      await new Promise((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .toFormat('wav')
          .audioFrequency(16000)     // Optimal for speech recognition
          .audioChannels(1)          // Mono for single speaker
          .audioBitrate(128)         // Good quality for speech
          .audioCodec('pcm_s16le')   // LINEAR16 codec
          .audioFilters([
            'highpass=f=80',         // Remove low frequency noise
            'lowpass=f=8000',        // Focus on speech frequencies
            'dynaudnorm=f=150'       // Normalize audio levels
          ])
          .on('error', (error) => {
            console.error('FFmpeg error:', error);
            reject(error);
          })
          .on('end', () => {
            resolve();
          })
          .save(tempAudioPath);
      });

      // Read the audio file
      const audioBuffer = fs.readFileSync(tempAudioPath);

      // Generate unique filename for audio
      const audioFileName = `audio-${Date.now()}.wav`;

      // Upload audio to Google Cloud Storage
      const audioFile = this.bucket.file(audioFileName);
      await audioFile.save(audioBuffer, {
        metadata: {
          contentType: 'audio/wav'
        }
      });

      // Clean up temporary files
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(tempAudioPath);

      return {
        fileName: audioFileName,
        gcsUri: `gs://${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${audioFileName}`
      };
      
    } catch (error) {
        console.error('Error in convertVideoToAudio:', error);
        // Clean up temporary files if they exist
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
        throw error;
    }
  }

  async transcribeVideo(videoBuffer, originalFileName, submissionId) {
    try {
      const { fileName, gcsUri } = await this.convertVideoToAudio(videoBuffer, originalFileName);

      await Submission.findByIdAndUpdate(submissionId, {
        transcriptionStatus: 'processing'
      });

      const request = {
        audio: { uri: gcsUri },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-IN',
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          useEnhanced: true,
          enableWordConfidence: true,
          enableSpeakerDiarization: false,
          profanityFilter: false,
          metadata: {
            interactionType: 'PRESENTATION',
            industryNaicsCodeOfAudio: 541613,
            originalMediaType: 'VIDEO'
          },
          hints: [
            'sales', 'pitch', 'product', 'service',
            'value proposition', 'benefits', 'features'
          ]
        }
      };

      const [operation] = await this.speechClient.longRunningRecognize(request);
      const [response] = await operation.promise();

      // Handle empty or invalid response
      if (!response?.results) {
        console.warn(`No transcription results for submission ${submissionId}`);
        await this.handleEmptyTranscription(submissionId);
        return this.createEmptyResponse();
      }

      // Process valid results
      const results = response.results.filter(result => 
        result?.alternatives?.[0]?.transcript && 
        result.alternatives[0].words?.length > 0
      );

      if (results.length === 0) {
        console.warn(`No valid transcription segments for submission ${submissionId}`);
        await this.handleEmptyTranscription(submissionId);
        return this.createEmptyResponse();
      }

      // Process transcription with enhanced metrics
      const transcription = this.processTranscriptionResults(results);
      
      // Calculate speech metrics
      const speechMetrics = {
        overallMetrics: {
          averageRate: calculateAverageSpeakingRate(transcription.words).averageRate,
          totalWords: transcription.words.length,
          totalDuration: transcription.words[transcription.words.length - 1].endTime - transcription.words[0].startTime
        },
        thresholds: {
          slow: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW,
          optimal: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.OPTIMAL,
          fast: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST
        },
        wordLevelMetrics: transcription.words.map(word => {
          const metrics = calculateSpeakingRate(word);
          return {
            word: word.word,
            startTime: word.startTime,
            endTime: word.endTime,
            confidence: word.confidence,
            rate: metrics ? metrics.rate : 0
          };
        })
      };

      // Get the challenge details for evaluation
      const submission = await Submission.findById(submissionId).populate('challenge');
      const evaluationCriteria = submission.challenge.evaluationCriteria;
      
      // Perform automatic evaluation
      const evaluationResult = evaluationService.evaluateTranscript(
        transcription.text,
        evaluationCriteria
      );

      // Update submission with transcription and evaluation results
      await Submission.findByIdAndUpdate(submissionId, {
        transcript: transcription.text,
        transcriptionStatus: 'completed',
        speechMetrics: {
          overallMetrics: {
            averageRate: speechMetrics.overallMetrics.averageRate,
            totalWords: speechMetrics.overallMetrics.totalWords,
            totalDuration: speechMetrics.overallMetrics.totalDuration
          },
          thresholds: {
            slow: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW,
            optimal: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.OPTIMAL,
            fast: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST
          },
          wordLevelMetrics: speechMetrics.wordLevelMetrics
        },
        automaticEvaluation: {
          ...evaluationResult,
          evaluatedAt: new Date()
        }
      });

      await this.bucket.file(fileName).delete();

      return {
        text: transcription.text,
        metrics: speechMetrics,
        evaluation: evaluationResult
      };

    } catch (error) {
      console.error("Error in transcribeVideo:", error);
      await Submission.findByIdAndUpdate(submissionId, {
        transcriptionStatus: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Helper methods
  async handleEmptyTranscription(submissionId) {
    await Submission.findByIdAndUpdate(submissionId, {
      transcriptionStatus: 'completed',
      transcript: '',
      speechMetrics: {
        overallMetrics: {
          averageRate: 0,
          totalWords: 0,
          totalDuration: 0
        },
        thresholds: {
          slow: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW,
          optimal: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.OPTIMAL,
          fast: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST
        },
        wordLevelMetrics: []
      }
    });
  }

  createEmptyResponse() {
    return {
      text: '',
      metrics: {
        overallMetrics: {
          averageRate: 0,
          totalWords: 0,
          totalDuration: 0
        },
        thresholds: {
          slow: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.SLOW,
          optimal: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.OPTIMAL,
          fast: SPEECH_RATE_CONSTANTS.WORDS_PER_MINUTE.FAST
        },
        wordLevelMetrics: []
      }
    };
  }

  processTranscriptionResults(results) {
    return results.reduce((acc, result) => {
      const alternative = result.alternatives[0];
      const words = alternative.words.map(word => ({
        word: word.word,
        startTime: Number(word.startTime.seconds) + Number(word.startTime.nanos) / 1e9,
        endTime: Number(word.endTime.seconds) + Number(word.endTime.nanos) / 1e9,
        confidence: Number(word.confidence)
      }));

      if (!acc.text) {
        return {
          text: alternative.transcript,
          confidence: alternative.confidence,
          words: words
        };
      }

      return {
        text: `${acc.text}\n${alternative.transcript}`,
        confidence: (acc.confidence + alternative.confidence) / 2,
        words: [...acc.words, ...words]
      };
    }, { text: '', confidence: 0, words: [] });
  }
}

module.exports = new TranscriptionService();
