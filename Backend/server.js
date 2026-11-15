const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for local storage
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Nexora API',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      register: '/api/auth/register',
      login: '/api/auth/login',
      datasets: '/api/datasets'
    }
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`📊 Dataset routes: http://localhost:${PORT}/api/datasets`);
});

module.exports = { app, server };
