const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'expo_voting_super_secret_jwt_key_2026_secure';
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET environment variable is missing in production!');
  }
  return jwt.sign(
    { id, role },
    secret,
    { expiresIn: '30d' }
  );
};

// @desc    Admin login & token generation
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide admin email and password' });
    }

    // Normalize email if 'admin' or 'admin@expo' was supplied
    const normalizedEmail = (email === 'admin' || email === 'admin@expo') ? 'admin@expo.com' : email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Account does not have admin privileges' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: error.message || 'Server error during admin login' });
  }
};

module.exports = {
  loginAdmin
};
