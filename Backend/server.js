const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/db');
const { verifyB2Connection, isB2Configured } = require('./config/s3Client');

const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Connect to MongoDB Atlas / Local MongoDB
connectDB();

// 2. Verify Backblaze B2 bucket connection on startup
if (isB2Configured()) {
  verifyB2Connection().then((status) => {
    if (status.connected) {
      console.log(`✅ Backblaze B2 Bucket Connected: "${status.bucket}" (${status.region})`);
    } else {
      console.warn(`⚠️ Backblaze B2 Connection Notice: ${status.message}`);
    }
  });
} else {
  console.log('ℹ️ Backblaze B2: Unconfigured in environment (Graceful local storage fallback active).');
}

// 3. Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory setup for local uploads fallback
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Nexora Backend API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        me: '/api/auth/me'
      },
      datasets: {
        list: 'GET /api/datasets',
        upload: 'POST /api/datasets/upload',
        getById: 'GET /api/datasets/:id',
        preview: 'GET /api/datasets/:id/preview',
        download: 'GET /api/datasets/:id/download',
        delete: 'DELETE /api/datasets/:id'
      }
    }
  });
});

// 4. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);

// 5. Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Nexora Backend API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
