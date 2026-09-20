/**
 * ============================================================================
 * 📚 BOOK MODEL & SCHEMA (`src/models/Book.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file defines the structure for all library catalogue titles.
 * It tracks book metadata (title, author, ISBN) along with physical inventory:
 *   - totalCopies: The total physical copies owned by the library.
 *   - availableCopies: How many copies are currently on the shelf ready to borrow.
 * 
 * ❓ INVENTORY RULE FOR BEGINNERS:
 * --------------------------------
 * - When a patron borrows a book: `availableCopies` decreases by 1.
 * - When a patron returns a book: `availableCopies` increases by 1.
 * - When `availableCopies === 0`: The book is completely checked out and cannot be issued!
 * ============================================================================
 */

import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  // Book title (e.g. "Clean Code" or "To Kill a Mockingbird")
  title: {
    type: String,
    required: [true, 'Please provide a book title'],
    trim: true
  },

  // Author name
  author: {
    type: String,
    required: [true, 'Please provide an author name'],
    trim: true
  },

  // International Standard Book Number (unique 10 or 13-digit code)
  isbn: {
    type: String,
    required: [true, 'Please provide an ISBN number'],
    unique: true, // No two books can share the exact same ISBN
    trim: true
  },

  // Academic or reading discipline/category
  category: {
    type: String,
    required: [true, 'Please select a discipline/category'],
    enum: [
      'Computer Science',
      'Literature',
      'Science & Nature',
      'History & Philosophy',
      'Arts & Architecture',
      'Economics & Society'
    ]
  },

  // Total physical copies owned by the library
  totalCopies: {
    type: Number,
    required: [true, 'Total copies count is required'],
    min: [1, 'Total copies must be at least 1'],
    default: 1
  },

  // How many physical copies are currently sitting on library shelves
  availableCopies: {
    type: Number,
    required: true,
    min: [0, 'Available copies cannot be negative'],
    default: 1
  },

  // Physical shelf location code in the library (e.g. "TECH-CS-01")
  shelfLocation: {
    type: String,
    default: 'GENERAL-STACKS'
  },

  // Publication year
  year: {
    type: Number
  },

  // Short synopsis or overview of the book
  description: {
    type: String,
    default: ''
  },

  // Aesthetic color theme used for book cards
  coverStyle: {
    type: String,
    enum: ['tech-deep', 'literature-classic', 'science-cosmic', 'history-amber', 'minimal-dark'],
    default: 'tech-deep'
  },

  // Optional web URL pointing to a book cover image
  coverUrl: {
    type: String,
    default: ''
  },

  // Popularity counter: increments every time this book is checked out
  borrowCount: {
    type: Number,
    default: 0
  },

  // Timestamp when the book was first entered into the catalogue
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ----------------------------------------------------------------------------
// TEXT SEARCH INDEX
// ----------------------------------------------------------------------------
// Enables lightning-fast searches when patrons search by title, author, or ISBN
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

export const Book = mongoose.model('Book', bookSchema);
