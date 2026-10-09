const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let isConnected = false;
let connectionAttempted = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/decentralized_voting';

  if (cached.conn) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    isConnected = true;
    return cached.conn;
  }

  if (!cached.promise) {
    const isLocalUri = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: isLocalUri ? 3000 : 10000,
      connectTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
      isConnected = true;
      try {
        const Vote = require('../models/Vote');
        Vote.syncIndexes().catch(() => {});
      } catch (iErr) {}
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      isConnected = false;
      if (!connectionAttempted) {
        console.warn(`⚠️ [DB NOTICE] MongoDB connection offline (${err.message}). Using in-memory auth fallback.`);
        connectionAttempted = true;
      }
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
};

module.exports = connectDB;
