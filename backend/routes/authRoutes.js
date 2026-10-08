const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  getMe,
  logout,
  registerUser,
  loginUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/auth/send-otp
router.post('/send-otp', sendOtp);

// @route POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// @route GET /api/auth/me
router.get('/me', protect, getMe);

// @route POST /api/auth/logout
router.post('/logout', logout);

// Legacy routes for password auth
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
