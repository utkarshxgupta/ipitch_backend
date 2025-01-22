const socketIo = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-submission', (submissionId) => {
        socket.join(`submission-${submissionId}`);
        console.log(`Socket ${socket.id} joined submission-${submissionId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Emit transcription progress updates
  emitTranscriptionProgress(submissionId, progress) {
    if (this.io) {
      this.io.to(`submission-${submissionId}`).emit('transcription-progress', progress);
    }
  }

  // Emit transcription completion
  emitTranscriptionComplete(submissionId, transcript) {
    if (this.io) {
      this.io.to(`submission-${submissionId}`).emit('transcription-complete', {
        transcript,
        status: 'completed'
      });
    }
  }

  // Emit transcription error
  emitTranscriptionError(submissionId, error) {
    if (this.io) {
      this.io.to(`submission-${submissionId}`).emit('transcription-error', {
        error: error.message,
        status: 'failed'
      });
    }
  }
}

module.exports = new SocketService();
