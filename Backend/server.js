const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB Database
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded datasets (when local storage fallback is used)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;
  res.json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'Nexora Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      name: mongoose.connection.name || 'Nexora',
      host: mongoose.connection.host || '127.0.0.1'
    }
  });
});

// Authentication Routes (Register, Login, Me, Logout)
app.use('/api/auth', authRoutes);

// Protected Dataset Routes (Requires JWT token, User-isolated datasets)
app.use('/api/datasets', datasetRoutes);

// Global Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Nexora Backend API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
