const mongoose = require('mongoose');

const connectDB = async () => {
  let mongoURI = process.env.MONGODB_URI;

  // Detect unconfigured Atlas placeholder string from .env
  const hasPlaceholders =
    mongoURI &&
    (mongoURI.includes('<username>') ||
      mongoURI.includes('<password>') ||
      mongoURI.includes('<db_username>') ||
      mongoURI.includes('<db_password>'));

  if (!mongoURI || hasPlaceholders) {
    if (hasPlaceholders) {
      console.warn(
        '⚠️  MONGODB_URI contains placeholder credentials (<username>:<password>).\n' +
        '   Falling back to local MongoDB: mongodb://127.0.0.1:27017/Nexora\n' +
        '   (To use MongoDB Atlas, replace <username> and <password> with your actual database user credentials in Backend/.env)'
      );
    }
    mongoURI = 'mongodb://127.0.0.1:27017/Nexora';
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (error.message && error.message.includes('Authentication failed')) {
      console.error(
        '👉 Authentication Error Fix: Your MongoDB Atlas connection URI has an invalid username or password.\n' +
        '   Open Backend/.env and update MONGODB_URI with your real Atlas user & password, or switch to local MongoDB:\n' +
        '   MONGODB_URI=mongodb://127.0.0.1:27017/Nexora'
      );
    }
    return null;
  }
};

module.exports = connectDB;
