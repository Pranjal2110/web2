/**
 * ============================================================================
 * 👤 USER MODEL & SCHEMA (`src/models/User.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file defines what a "User" looks like in our library system.
 * A User can either be:
 *   1. A Member (Patron): Can browse books, borrow up to their limit, and view their loans.
 *   2. A Librarian (Admin): Can manage inventory (Add/Edit/Delete books), issue loans directly, and waive fines.
 * 
 * ❓ WHAT IS A MONGOOSE SCHEMA?
 * -----------------------------
 * A Schema is like a blueprint or template for a database record. It defines:
 *   - What fields exist (e.g. name, email, password)
 *   - What type of data each field holds (String, Number, Date)
 *   - Validation rules (e.g. required: true, minimum password length)
 * 
 * 🔒 SECURITY NOTE FOR BEGINNERS:
 * ------------------------------
 * We NEVER save plain-text passwords in a database!
 * Before a user is saved, the `pre('save')` hook automatically scrambles
 * (hashes) their password using `bcryptjs`.
 * ============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the blueprint for every user in the database
const userSchema = new mongoose.Schema({
  // Full Name of the patron or staff member
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true // Automatically removes extra spaces before or after the name
  },

  // Unique email address used for logging into the portal
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true, // Prevents duplicate accounts with the same email
    lowercase: true, // Converts all emails to lowercase (e.g. Test@Mail.com -> test@mail.com)
    trim: true
  },

  // Password (stored securely as an encrypted bcrypt hash)
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long']
  },

  // Unique library card ID issued to each patron (e.g. "LIB-2026-101" or "MEM-2026-202")
  cardId: {
    type: String,
    required: true,
    unique: true
  },

  // The role determines what pages and actions the user can access
  role: {
    type: String,
    enum: ['member', 'librarian'], // Can ONLY be one of these two choices
    default: 'member'
  },

  // Maximum number of physical books this member is allowed to borrow at the same time
  borrowLimit: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },

  // Cumulative total of all overdue fines paid by this member (in dollars)
  totalFinesPaid: {
    type: Number,
    default: 0
  },

  // Account standing: active patrons can borrow books; suspended patrons are blocked
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },

  // Date and time when the account was first created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ----------------------------------------------------------------------------
// AUTOMATIC PASSWORD HASHING (Mongoose "pre-save" hook)
// ----------------------------------------------------------------------------
// This function runs automatically right before saving a user to MongoDB.
userSchema.pre('save', async function (next) {
  // If the password hasn't been changed, skip hashing and continue
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a random salt (complexity level 10) and encrypt the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ----------------------------------------------------------------------------
// HELPER METHOD: COMPARE ENTERED PASSWORD WITH STORED HASH
// ----------------------------------------------------------------------------
// Used during login to safely check if the password entered by the user is correct
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
export const User = mongoose.model('User', userSchema);
