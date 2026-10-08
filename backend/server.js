const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const path = require('path');
// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Ensure DB connection is attempted without crashing routes on local offline dev
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Proceed to route handlers; controllers will use in-memory fallback if needed
  }
  next();
});

// Dynamic Production CORS Configuration
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
const allowedOrigins = [
  frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!frontendUrl || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/votes', require('./routes/voteRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'OK',
    message: 'Backend is running',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root documentation endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Project Expo Decentralized Voting System API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      projects: {
        getAll: 'GET /api/projects',
        getOne: 'GET /api/projects/:id',
        create: 'POST /api/projects (Admin)',
        update: 'PUT /api/projects/:id (Admin)',
        delete: 'DELETE /api/projects/:id (Admin)'
      },
      votes: {
        castVote: 'POST /api/votes (JWT required, 1-vote/project)',
        checkVoted: 'GET /api/votes/check/:projectId (JWT required)'
      },
      feedback: {
        submit: 'POST /api/feedback (JWT required)',
        getByProject: 'GET /api/feedback/:projectId'
      },
      results: {
        leaderboard: 'GET /api/results',
        projectResults: 'GET /api/results/:projectId'
      }
    }
  });
});

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    message: `Not Found - Route ${req.originalUrl} does not exist on this server`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey === 're_xxxxxxxxx' || resendKey.includes('your_resend_api_key')) {
    console.warn('⚠️ [CONFIG NOTICE] RESEND_API_KEY is not set with a real key in backend/.env. Replace re_xxxxxxxxx with your actual Resend API key from resend.com.');
  } else {
    console.log('✅ [CONFIG] Resend API Key configured.');
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
    console.log(`Health check: /api/health`);
  });
}

// Export Express app for Vercel Serverless Functions
module.exports = app;
