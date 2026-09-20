/**
 * ============================================================================
 * 🍃 DATABASE CONNECTION CONFIGURATION (`src/config/db.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file is responsible for connecting our Node.js app to MongoDB using Mongoose.
 * 
 * 🌐 THREE MODES OF CONNECTION (Resilient Multi-Stage Fallback):
 * -------------------------------------------------------------
 * 1. ☁️ Cloud MongoDB Atlas:
 *    If `MONGODB_URI` is provided (in `.env` or in your Render.com Environment variables),
 *    it connects to your cloud database cluster.
 * 
 * 2. 💻 Local MongoDB (Development):
 *    If no `MONGODB_URI` is provided, it tries to connect to `mongodb://127.0.0.1:27017/athenaeum_db`.
 * 
 * 3. 🚀 Automatic Embedded In-Memory Fallback (Zero-Config Cloud Deployments):
 *    If deployed on Render/cloud where no local MongoDB exists and no `MONGODB_URI` was set,
 *    it automatically starts an embedded in-memory MongoDB engine.
 *    This ensures your Render deployment NEVER crashes with `ECONNREFUSED`!
 * ============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let activeMongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/athenaeum_db';
let memoryServerInstance = null;

export function getActiveMongoUri() {
  return activeMongoUri;
}

/**
 * Connects to MongoDB with multi-stage fallback (Atlas -> Local -> In-Memory)
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // --------------------------------------------------------------------------
  // STAGE 1: Check if user provided an explicit MONGODB_URI (e.g. MongoDB Atlas)
  // --------------------------------------------------------------------------
  if (process.env.MONGODB_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      activeMongoUri = process.env.MONGODB_URI;
      console.log(`🍃 Connected to MongoDB Atlas Cloud! Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error(`❌ Failed to connect to provided MONGODB_URI: ${err.message}`);
      console.error(`👉 Verify your username, password, and IP access list in MongoDB Atlas.`);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // STAGE 2: Try connecting to Local MongoDB (Development only)
  // --------------------------------------------------------------------------
  const isCloudOrProd = process.env.RENDER || process.env.NODE_ENV === 'production';
  if (!isCloudOrProd) {
    try {
      const conn = await mongoose.connect(activeMongoUri, {
        serverSelectionTimeoutMS: 2000 // Fast 2-second check
      });
      console.log(`🍃 Connected to Local MongoDB! Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
      return conn;
    } catch (localErr) {
      console.log(`\n⚠️  Local MongoDB not detected on 127.0.0.1:27017.`);
      await mongoose.disconnect(); // Cleanly reset connection topology
    }
  }

  // ------------------------------------------------------------------------
  // STAGE 3: Cloud / Fallback In-Memory MongoDB Engine
  // ------------------------------------------------------------------------
  console.log(`✨ Cloud / Zero-Config environment detected without configured MONGODB_URI.`);
  console.log(`🚀 Activating embedded in-memory MongoDB engine...`);

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    activeMongoUri = memoryServerInstance.getUri();

    const conn = await mongoose.connect(activeMongoUri);
    console.log(`🍃 Connected to Embedded In-Memory MongoDB: ${activeMongoUri}`);
    console.log(`✅ App started successfully with zero crash!`);
    console.log(`💡 Tip: For persistent data across restarts on Render, set MONGODB_URI in Render's Environment tab.\n`);
    return conn;
  } catch (memErr) {
    console.error(`❌ Critical database error:`, memErr);
    throw memErr;
  }
}
