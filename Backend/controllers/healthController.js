const mongoose = require('mongoose');

// @desc    Get server and database health status
// @route   GET /api/health
// @access  Public
const getHealthStatus = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const isConnected = dbState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'UP' : 'DOWN',
    message: isConnected
      ? 'Backend server is healthy and MongoDB is connected'
      : 'Backend server is up, but MongoDB is not connected',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    }
  });
};

module.exports = {
  getHealthStatus
};
