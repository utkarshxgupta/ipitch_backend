const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

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

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
