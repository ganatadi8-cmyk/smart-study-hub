const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Root
app.get('/', (req, res) => {
  res.send('Smart Study Hub API is running. Access the frontend at http://localhost:5173');
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Study Hub API is running' });
});

// Import Routes
const resourceRoutes = require('./routes/resources');
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const discussionRoutes = require('./routes/discussions');
const aiRoutes = require('./routes/ai');

app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
