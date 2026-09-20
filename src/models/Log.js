/**
 * ============================================================================
 * 📝 AUDIT LOG MODEL (`src/models/Log.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file records an "Audit Trail" (history log) of important actions in the library.
 * 
 * ❓ WHY DO WE NEED AN AUDIT LOG?
 * -------------------------------
 * In real-world enterprise applications, it is essential to know who did what and when.
 * For example:
 *   - "Librarian Eleanor added a new book 'Clean Code'"
 *   - "Patron Alex checked out 'The Republic'"
 *   - "Librarian waived an overdue fine of $5.25 for Sarah"
 * 
 * Having an audit log makes troubleshooting, debugging, and administrative oversight easy!
 * ============================================================================
 */

import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  // Category of the action (e.g., 'BOOK_ADDED', 'BOOK_ISSUED', 'FINE_PAID', 'TIME_TRAVEL')
  action: {
    type: String,
    required: true
  },

  // Human-readable description explaining what happened
  details: {
    type: String,
    required: true
  },

  // Which user performed this action (optional for system events)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Exact timestamp when this event occurred
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Log = mongoose.model('Log', logSchema);
