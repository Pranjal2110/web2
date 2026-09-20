/**
 * ============================================================================
 * 🍃 DATABASE CONNECTION CONFIGURATION (`src/config/db.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file is responsible for connecting our Node.js app to MongoDB using Mongoose.
 * 
 * ❓ WHAT IS MONGOOSE & MONGODB?
 * -----------------------------
 * - MongoDB is a NoSQL document database. Instead of rows and tables, it stores
 *   information as flexible, JSON-like documents.
 * - Mongoose is an ODM (Object Data Modeling) library for Node.js. It acts as
 *   a translator between our JavaScript code and the MongoDB database, providing
 *   schemas, validations, and query helpers.
 * 
 * 🌐 CLOUD (ATLAS) VS LOCAL:
 * --------------------------
 * - MongoDB Atlas: A cloud database hosted by MongoDB. You provide a connection
 *   string like `mongodb+srv://user:pass@cluster.mongodb.net/athenaeum`.
 * - Local MongoDB: A database running directly on your computer at `mongodb://127.0.0.1:27017`.
 * ============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Default connection string: use environment variable MONGODB_URI if set, otherwise fallback to local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/athenaeum_db';

/**
 * Connects to MongoDB database with error handling and helpful beginner diagnostics
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Wait up to 5 seconds before reporting a connection timeout
    });

    console.log(`🍃 Connected to MongoDB! Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`\n❌ MONGODB CONNECTION ERROR:`);
    console.error(`   Message: ${err.message}`);
    console.error(`\n💡 BEGINNER TROUBLESHOOTING HINTS:`);
    console.error(`   1. If using Local MongoDB: Check if MongoDB is running (e.g., 'brew services start mongodb-community')`);
    console.error(`   2. If using MongoDB Atlas Cloud: Verify your connection string in your .env file:`);
    console.error(`      MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/athenaeum"`);
    console.error(`   3. Verify network access: in MongoDB Atlas, ensure your IP address is whitelisted (0.0.0.0/0 for testing).\n`);
    throw err;
  }
}
