const speech = require("@google-cloud/speech").v1;
const { Storage } = require("@google-cloud/storage");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const os = require("os");
const socketService = require('./socketService'); // import socket service
const Submission = require('../models/Submission'); // Ensure you import the model

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
          .audioFrequency(16000)  // Required for Google Speech-to-Text
          .audioChannels(1)       // Mono audio
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

  async transcribeAudio(gcsUri) {
    try {
        const request = {
            audio: {
              uri: gcsUri
            },
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
            },
          };

      // Perform the transcription
      const [response] = await this.speechClient.recognize(request);

      // Combine all transcriptions
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");

      return transcription;
    } catch (error) {
      console.error("Error in transcribeAudio:", error);
      throw error;
    } 
  }

  async processVideo(videoBuffer, originalFileName) {
    try {
      // Convert video to audio and upload to GCS
      const { fileName, gcsUri } = await this.convertVideoToAudio(videoBuffer, originalFileName);
      
      // Transcribe the audio
      const transcript = await this.transcribeAudio(gcsUri);

      // Optionally delete the audio file after transcription
      // await this.bucket.file(fileName).delete().catch(console.error);

      return transcript;
    } catch (error) {
      console.error("Error in processVideo:", error);
      throw error;
    }
  }

  async processVideoStreaming(videoBuffer, submissionId, originalFileName) {
    try {
      const { fileName, gcsUri } = await this.convertVideoToAudio(
        videoBuffer,
        originalFileName
      );

      // Build request for streaming
      const request = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-IN',
          enableAutomaticPunctuation: true,
        },
        audio: { uri: gcsUri },
      };

      // Start streaming recognition
      const recognizeStream = this.speechClient
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error('Streaming error:', error);
          socketService.emitTranscriptionError(submissionId, error);
        })
        .on('data', (data) => {
          if (data.results && data.results[0] && data.results[0].alternatives[0]) {
            const partialTranscript = data.results[0].alternatives[0].transcript;
            socketService.emitTranscriptionProgress(submissionId, partialTranscript);
          }
        })
        .on('end', async () => {
          // Perform a final recognition (or gather transcripts from data events)
          const finalTranscript = await this.transcribeAudio(gcsUri);

          // Update the submission document
        await Submission.findByIdAndUpdate(submissionId, {
            transcript: finalTranscript,
            transcriptionStatus: 'completed'
          });
          
          socketService.emitTranscriptionComplete(submissionId, finalTranscript);
          
          // Optionally remove audio from GCS
          // await this.bucket.file(fileName).delete().catch(console.error);
        });

      // End streaming
      setTimeout(() => {
        recognizeStream.end();
      }, 240000); // 4 minutes max, example

    } catch (error) {
      console.error("Error in processVideoStreaming:", error);
      socketService.emitTranscriptionError(submissionId, error);
      throw error;
    }
  }
}

module.exports = new TranscriptionService();
