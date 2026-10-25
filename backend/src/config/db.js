/**
 * Database Connection Configuration.
 * Connects to MongoDB Atlas using Mongoose with modern connection pool options.
 */

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'Silk_and_fashion';

  if (!uri) {
    console.warn('⚠️ WARNING: MONGODB_URI is not defined in environment variables. Database connection skipped.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
    });
    console.log(`✅ Successfully connected to MongoDB Atlas database: ${dbName} (Host: ${conn.connection.host})`);
  } catch (err) {
    console.error('❌ Could not connect to MongoDB Atlas:', err.message);
  }
}

module.exports = { connectDB };
