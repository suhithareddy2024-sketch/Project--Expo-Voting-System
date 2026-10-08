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

/**
 * Idempotent helper to ensure the official admin user exists in MongoDB
 */
const ensureAdminUserExists = async () => {
  try {
    const adminEmail = 'karrisuhithareddy.24.it@anits.edu.in';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('anits148', salt);
      adminUser = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      console.log('Ensured Admin user created in MongoDB: karrisuhithareddy.24.it@anits.edu.in');
    } else if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      adminUser.isVerified = true;
      await adminUser.save();
    }
    return adminUser;
  } catch (err) {
    console.error('Error ensuring admin user exists:', err.message);
    return null;
  }
};

// @desc    Admin login & token generation
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const rawIdentifier = (req.body.email || req.body.username || req.body.emailOrUsername || '').trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: 'Please provide admin email/username and password' });
    }

    const normalizedIdentifier = rawIdentifier.toLowerCase();

    // Find admin user in database
    let user = await User.findOne({ email: normalizedIdentifier });

    // If logging in with the designated admin email and not yet in DB, ensure existence
    if (!user && normalizedIdentifier === 'karrisuhithareddy.24.it@anits.edu.in') {
      user = await ensureAdminUserExists();
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Account does not have admin privileges' });
    }

    // Compare bcrypt hashed password
    let isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate production JWT
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
  loginAdmin,
  ensureAdminUserExists
};
