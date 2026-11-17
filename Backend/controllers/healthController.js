const mongoose = require('mongoose');
const { isB2Configured, getB2BucketName, getB2Region, verifyB2Connection } = require('../config/s3Client');

/**
 * @desc    Get server, database, and Backblaze B2 storage health status
 * @route   GET /api/health
 * @access  Public
 */
const getHealthStatus = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  // Backblaze B2 connection check
  const b2Status = await verifyB2Connection();

  const isHealthy = isDbConnected || b2Status.connected;

  res.status(isHealthy ? 200 : 200).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Nexora Backend API',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      status: dbStatusMap[dbState] || 'Unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    },
    storage: {
      provider: 'backblaze_b2',
      configured: isB2Configured(),
      connected: b2Status.connected,
      bucket: b2Status.bucket,
      region: b2Status.region,
      endpoint: b2Status.endpoint,
      message: b2Status.message
    }
  });
};

module.exports = {
  getHealthStatus
};
