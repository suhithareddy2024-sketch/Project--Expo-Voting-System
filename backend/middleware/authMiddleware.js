const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'expo_voting_super_secret_jwt_key_2026_secure';
      const decoded = jwt.verify(token, secret);

      // Check DB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch (e) {}
      }

      // If not in DB, check memUsers or synthesize from token
      if (!req.user) {
        const { memUsers } = require('../controllers/authController');
        for (const u of memUsers.values()) {
          if (String(u._id) === String(decoded.id)) {
            req.user = u;
            break;
          }
        }
      }

      // If still not found but decoded has valid token payload
      if (!req.user && decoded.id) {
        req.user = {
          _id: decoded.id,
          role: decoded.role || 'user',
          isVerified: true
        };
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found or token invalid' });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no Bearer token provided' });
  }
};

module.exports = { protect };
