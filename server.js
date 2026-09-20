/**
 * ============================================================================
 * 🚀 ATHENAEUM LIBRARY MANAGEMENT SYSTEM - SERVER BOOTSTRAPPER (`server.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This is the "ignition key" or main entry point of the entire application.
 * When you run `npm start` or `node server.js`, Node.js starts here.
 * 
 * 📋 WHAT DOES IT DO? (STEP-BY-STEP)
 * ---------------------------------
 * 1. Loads secret configuration variables from the `.env` file (like database passwords and port numbers).
 * 2. Establishes a connection to the MongoDB database (either MongoDB Atlas cloud or local MongoDB).
 * 3. Checks if the database is empty: if it is brand new, it automatically seeds it with sample books, users, and loans.
 * 4. Starts the Express web server and begins listening for incoming browser requests on port 3000.
 * ============================================================================
 */

import dotenv from 'dotenv';
// Load environment variables from the .env file into process.env
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { Book } from './src/models/Book.js';
import { seedDatabase } from './src/utils/seeder.js';

// The port number where our website will be available (defaults to 3000)
const PORT = process.env.PORT || 3000;

/**
 * Starts the application in proper sequence
 */
async function startServer() {
  try {
    // ------------------------------------------------------------------------
    // STEP 1: Connect to the Database
    // ------------------------------------------------------------------------
    console.log('⏳ Connecting to MongoDB database...');
    await connectDB();

    // ------------------------------------------------------------------------
    // STEP 2: Check if Database Needs Initial Sample Data
    // ------------------------------------------------------------------------
    // If there are zero books in the database, automatically populate it with demo data
    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      console.log('📦 Database is empty! Running automatic initial seed...');
      await seedDatabase();
    }

    // ------------------------------------------------------------------------
    // STEP 3: Start the Express HTTP Web Server
    // ------------------------------------------------------------------------
    app.listen(PORT, () => {
      console.log(`\n============================================================`);
      console.log(`🏛️  ATHENAEUM LIBRARY MANAGEMENT SYSTEM (SSR Edition)`);
      console.log(`============================================================`);
      console.log(`🚀 Web Application is live at: http://localhost:${PORT}`);
      console.log(`📚 Technology Stack: Node.js + Express.js + EJS + MongoDB + Sessions`);
      console.log(`👥 Demo Logins available on the login page:`);
      console.log(`   - Eleanor Vance (Librarian Admin)`);
      console.log(`   - Alex Rivera   (Member Patron - Active Loans)`);
      console.log(`   - Sarah Chen    (Member Patron - Overdue Loan)`);
      console.log(`============================================================\n`);
    });
  } catch (err) {
    // If anything fails during startup, print the error clearly and stop
    console.error('❌ CRITICAL ERROR: Could not start the library server:', err.message);
    process.exit(1);
  }
}

// Fire up the server!
startServer();
