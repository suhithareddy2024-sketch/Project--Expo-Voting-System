const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOTPEmail } = require('../services/emailService');

// In-Memory Fallback Stores for when MongoDB is offline locally
const memOtps = new Map();
const memUsers = new Map();

// Helper to check if MongoDB is active
const isDbConnected = () => mongoose.connection.readyState === 1;

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'expo_voting_super_secret_jwt_key_2026_secure';
  return jwt.sign(
    { id: String(id), role },
    secret,
    { expiresIn: '30d' }
  );
};

/**
 * Validate email address format & optional domain constraints
 */
const validateEmailAddress = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) return false;

  // Strict domain enforcement only if explicitly turned on via env
  if (process.env.STRICT_COLLEGE_DOMAIN === 'true') {
    return clean.endsWith('@anits.edu.in');
  }
  return true;
};

// @desc    Send secure 6-digit OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!validateEmailAddress(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format. Please enter a valid email.'
      });
    }

    // Check resend cooldown (60 seconds)
    let existingOtp = null;
    if (isDbConnected()) {
      try {
        existingOtp = await Otp.findOne({ email: cleanEmail });
      } catch (e) {
        existingOtp = memOtps.get(cleanEmail);
      }
    } else {
      existingOtp = memOtps.get(cleanEmail);
    }

    if (existingOtp && existingOtp.lastSentAt) {
      const timeSinceLastSent = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < 60) {
        const remainingSeconds = Math.ceil(60 - timeSinceLastSent);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`
        });
      }
    }

    // Generate cryptographically secure 6-digit OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before storing (SHA-256)
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Set 5-minute expiry (300 seconds)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Send Email via Email Service (Nodemailer SMTP / Resend / Dev console fallback)
    const dispatchResult = await sendOTPEmail(cleanEmail, otp);

    if (!dispatchResult || !dispatchResult.success) {
      return res.status(400).json({
        success: false,
        message: dispatchResult ? dispatchResult.message : 'Unable to send OTP. Please try again later.'
      });
    }

    // Store in DB or Memory
    if (isDbConnected()) {
      try {
        await Otp.deleteMany({ email: cleanEmail });
        await Otp.create({
          email: cleanEmail,
          otpHash,
          expiresAt,
          attempts: 0,
          lastSentAt: new Date()
        });
      } catch (dbErr) {
        memOtps.set(cleanEmail, {
          email: cleanEmail,
          otpHash,
          expiresAt,
          attempts: 0,
          lastSentAt: new Date()
        });
      }
    } else {
      memOtps.set(cleanEmail, {
        email: cleanEmail,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date()
      });
    }

    const responsePayload = {
      success: true,
      message: dispatchResult.message || 'OTP sent successfully to your email.'
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during OTP generation'
    });
  }
};

// @desc    Verify OTP & Authenticate User (Marks Verified)
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and 6-digit OTP'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpStr = otp.toString().trim();

    if (!validateEmailAddress(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address.'
      });
    }

    // Find OTP record
    let otpRecord = null;
    let usingDb = isDbConnected();

    if (usingDb) {
      try {
        otpRecord = await Otp.findOne({ email: cleanEmail });
      } catch (e) {
        usingDb = false;
        otpRecord = memOtps.get(cleanEmail);
      }
    } else {
      otpRecord = memOtps.get(cleanEmail);
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or was not requested. Please request a new OTP.'
      });
    }

    // Check 5-minute expiration
    if (new Date() > new Date(otpRecord.expiresAt)) {
      if (usingDb) await Otp.deleteMany({ email: cleanEmail }).catch(() => {});
      memOtps.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check maximum 5 attempts
    if (otpRecord.attempts >= 5) {
      if (usingDb) await Otp.deleteMany({ email: cleanEmail }).catch(() => {});
      memOtps.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.'
      });
    }

    // Compute SHA-256 hash of provided OTP
    const inputHash = crypto.createHash('sha256').update(otpStr).digest('hex');

    if (inputHash !== otpRecord.otpHash) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (usingDb) {
        try {
          await otpRecord.save();
        } catch (e) {}
      } else {
        memOtps.set(cleanEmail, otpRecord);
      }

      if (otpRecord.attempts >= 5) {
        if (usingDb) await Otp.deleteMany({ email: cleanEmail }).catch(() => {});
        memOtps.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code and try again.'
      });
    }

    // OTP Verified successfully! Invalidate OTP to prevent reuse
    if (usingDb) {
      await Otp.deleteMany({ email: cleanEmail }).catch(() => {});
    }
    memOtps.delete(cleanEmail);

    // Retrieve or Create User
    let user = null;
    const defaultName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0].replace(/[._]/g, ' ');

    if (usingDb) {
      try {
        user = await User.findOne({ email: cleanEmail });
        if (!user) {
          user = await User.create({
            name: defaultName,
            email: cleanEmail,
            isVerified: true,
            lastLogin: new Date(),
            role: 'user'
          });
        } else {
          user.isVerified = true;
          user.lastLogin = new Date();
          if (name && name.trim()) user.name = name.trim();
          await user.save();
        }
      } catch (dbUserErr) {
        usingDb = false;
      }
    }

    if (!usingDb || !user) {
      // In-memory user fallback
      let memUser = memUsers.get(cleanEmail);
      if (!memUser) {
        memUser = {
          _id: 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          name: defaultName,
          email: cleanEmail,
          isVerified: true,
          role: 'user',
          lastLogin: new Date()
        };
      } else {
        memUser.isVerified = true;
        memUser.lastLogin = new Date();
        if (name && name.trim()) memUser.name = name.trim();
      }
      memUsers.set(cleanEmail, memUser);
      user = memUser;
    }

    const token = generateToken(user._id, user.role);

    console.log(`🎉 [VERIFICATION SUCCESS] User verified: ${user.email} (ID: ${user._id})`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
        hasVoted: Boolean(user.hasVoted),
        votedProjectId: user.votedProjectId || null
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during OTP verification'
    });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        isVerified: Boolean(req.user.isVerified),
        hasVoted: Boolean(req.user.hasVoted),
        votedProjectId: req.user.votedProjectId || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Legacy password registration & login handlers
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!validateEmailAddress(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    let user = null;
    if (isDbConnected()) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
        isVerified: true,
        role: role === 'admin' ? 'admin' : 'user'
      });
    } else {
      user = {
        _id: 'mem_' + Date.now(),
        name,
        email: cleanEmail,
        role: role === 'admin' ? 'admin' : 'user',
        isVerified: true
      };
      memUsers.set(cleanEmail, user);
    }

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
        hasVoted: Boolean(user.hasVoted),
        votedProjectId: user.votedProjectId || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const cleanEmail = email.toLowerCase().trim();

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } else {
      user = memUsers.get(cleanEmail);
      if (!user) {
        // Allow admin login fallback
        if (cleanEmail === 'karrisuhithareddy.24.it@anits.edu.in' && password === 'anits148') {
          user = { _id: 'mem_admin', name: 'Admin', email: cleanEmail, role: 'admin', isVerified: true, hasVoted: false };
          memUsers.set(cleanEmail, user);
        } else {
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
      }
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
        hasVoted: Boolean(user.hasVoted),
        votedProjectId: user.votedProjectId || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  logout,
  registerUser,
  loginUser,
  memUsers
};
