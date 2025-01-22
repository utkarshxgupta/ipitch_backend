const Queue = require('bull');
const TranscriptionService = require('./transcription');
const Submission = require('../models/Submission');

// Create transcription queue
const transcriptionQueue = new Queue('transcription', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process transcription jobs
transcriptionQueue.process(async (job) => {
  const { submissionId, videoUrl } = job.data;
  
  try {
    // Update submission status to processing
    await Submission.findByIdAndUpdate(submissionId, {
      transcriptionStatus: 'processing'
    });

    // Process video and get transcript
    const transcript = await TranscriptionService.processVideo(videoUrl);

    // Update submission with transcript
    await Submission.findByIdAndUpdate(submissionId, {
      transcript,
      transcriptionStatus: 'completed'
    });

    return { success: true, submissionId };
  } catch (error) {
    console.error('Transcription job failed:', error);
    
    // Update submission status to failed
    await Submission.findByIdAndUpdate(submissionId, {
      transcriptionStatus: 'failed'
    });

    throw error;
  }
});

// Handle completed jobs
transcriptionQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed for submission ${result.submissionId}`);
});

// Handle failed jobs
transcriptionQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

module.exports = {
  addTranscriptionJob: async (submissionId, videoUrl) => {
    return transcriptionQueue.add({
      submissionId,
      videoUrl
    });
  }
};
