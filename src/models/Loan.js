/**
 * ============================================================================
 * 📋 LOAN MODEL & SCHEMA (`src/models/Loan.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file models a "Loan" (circulation checkout record).
 * Every time a library member borrows a book, a Loan document is created.
 * 
 * ❓ KEY CONCEPTS FOR BEGINNERS:
 * -----------------------------
 * 1. Relationships (`ref: 'Book'`, `ref: 'User'`):
 *    Instead of copying all book and user info into every loan, MongoDB stores
 *    their unique ID. Using `.populate('book member')`, Mongoose automatically
 *    fetches the full book title and patron name when needed.
 * 
 * 2. Loan Status Lifecycle:
 *    - `active`: The book is currently with the member and due date has not passed.
 *    - `overdue`: The due date has passed without return; fines begin accumulating.
 *    - `returned`: The book has been safely returned back to the library shelves.
 * 
 * 3. Fines:
 *    - `fineAccrued`: Amount in dollars ($0.75 / day overdue).
 *    - `finePaid`: True once the member pays or the librarian waives it.
 * ============================================================================
 */

import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  // Reference to the physical book being borrowed
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },

  // Reference to the member who borrowed the book
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Date and time when the book was checked out
  issueDate: {
    type: Date,
    default: Date.now
  },

  // Date by which the book must be returned to avoid fines (typically 14 days later)
  dueDate: {
    type: Date,
    required: true
  },

  // Date when the book was actually returned (null while still checked out)
  returnDate: {
    type: Date,
    default: null
  },

  // Current status of this circulation checkout
  status: {
    type: String,
    enum: ['active', 'overdue', 'returned'],
    default: 'active'
  },

  // Overdue fine accumulated (e.g. 5 days overdue * $0.75/day = $3.75)
  fineAccrued: {
    type: Number,
    default: 0
  },

  // Whether the fine has been settled (paid by patron or waived by librarian)
  finePaid: {
    type: Boolean,
    default: false
  },

  // Timestamp when this record was created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Loan = mongoose.model('Loan', loanSchema);
