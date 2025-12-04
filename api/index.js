// Vercel Serverless Entry Point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Track Senpi API is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const senpiRoutes = require('./routes/senpi');
const locationRoutes = require('./routes/location');
const uploadRoutes = require('./routes/upload');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/senpi', senpiRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/upload', uploadRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
