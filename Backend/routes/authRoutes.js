const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
router.route('/register')
  .post(registerUser)
  .get((req, res) => {
    res.status(405).json({
      success: false,
      message: 'Method Not Allowed. /api/auth/register requires an HTTP POST request with { name, email, password } in the body.',
      hint: 'If you want to view the registration page UI, visit http://localhost:5173/register'
    });
  });

// @route   POST /api/auth/login
router.route('/login')
  .post(loginUser)
  .get((req, res) => {
    res.status(405).json({
      success: false,
      message: 'Method Not Allowed. /api/auth/login requires an HTTP POST request with { email, password } in the body.',
      hint: 'If you want to view the login page UI, visit http://localhost:5173/login'
    });
  });

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
router.post('/logout', logoutUser);

module.exports = router;
