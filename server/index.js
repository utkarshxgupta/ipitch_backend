const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const TransformerEmbeddingService = require('./services/transformerEmbeddingService');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// Increase payload limit
app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ limit: '120mb', extended: true }));

connectDB();

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('iPitch server running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 120MB',
        error: err.message
      });
    }
  }
  next(err);
});

async function initializeServices() {
  try {
    // Pre-load models in parallel
    await Promise.all([
      TransformerEmbeddingService.initialize()
    ]);
    
    // Start the server only after initializing services
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize services:', error);
    // Continue starting the server even if model loading fails
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} (some services failed to initialize)`);
    });
  }
}

initializeServices();
