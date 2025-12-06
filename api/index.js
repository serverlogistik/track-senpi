// Vercel Serverless Entry Point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// CORS - Must be BEFORE other middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Other Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Track Senpi API is running on Vercel',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const senpiRoutes = require('./routes/senpi');
const locationRoutes = require('./routes/location');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/senpi', senpiRoutes);
app.use('/api/location', locationRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
