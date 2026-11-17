const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - strictly ensures request has a valid Bearer JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key'
      );

      // Attach user object (excluding password) to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      return next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches req.user if a valid token is provided, but allows the request to continue if not
 */
const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Continue unauthenticated if token is invalid
      req.user = null;
    }
  }
  return next();
};

module.exports = {
  protect,
  optionalProtect
};
