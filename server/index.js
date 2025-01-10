const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('iPitch server running...');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
