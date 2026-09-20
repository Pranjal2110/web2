/**
 * ============================================================================
 * 📚 BOOK ROUTES & CATALOGUE CONTROLLER (`src/routes/book.routes.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file controls everything related to books:
 *   1. Browsing the catalogue with search, category filters, and sorting.
 *   2. Viewing individual book details and shelf locations.
 *   3. Librarian CRUD operations:
 *      - [C]reate: Add new books to the collection.
 *      - [R]ead:   Browse and inspect books.
 *      - [U]pdate: Edit details or change physical copy counts.
 *      - [D]elete: Remove books (with guardrails protecting checked-out titles).
 * 
 * 🛡️ CRITICAL GUARDRAIL FOR BEGINNERS:
 * -------------------------------------
 * A librarian cannot delete a book if a patron currently has it checked out!
 * This prevents data corruption and lost inventory.
 * ============================================================================
 */

import express from 'express';
import { Book } from '../models/Book.js';
import { Loan } from '../models/Loan.js';
import { Log } from '../models/Log.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * 1. GET /books - Catalogue with Search, Category Filter, and Sorting
 * ----------------------------------------------------------------------------
 */
router.get('/', async (req, res) => {
  try {
    const { q, category, availability, sort } = req.query;
    let query = {};

    // STEP 1: Text / Keyword Search (matches title, author, or ISBN)
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i'); // 'i' flag means case-insensitive
      query.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex }
      ];
    }

    // STEP 2: Filter by Academic Discipline / Category
    if (category && category !== 'all') {
      query.category = category;
    }

    // STEP 3: Filter by Availability on the Shelf
    if (availability === 'available') {
      query.availableCopies = { $gt: 0 }; // more than 0 copies
    } else if (availability === 'low') {
      query.availableCopies = 1;          // only 1 copy left
    } else if (availability === 'unavailable') {
      query.availableCopies = 0;          // completely checked out
    }

    // STEP 4: Choose Sorting Order
    let sortOption = { borrowCount: -1 }; // Default: Most popular books first
    if (sort === 'title-asc') sortOption = { title: 1 };
    else if (sort === 'title-desc') sortOption = { title: -1 };
    else if (sort === 'author') sortOption = { author: 1 };
    else if (sort === 'year-desc') sortOption = { year: -1 };
    else if (sort === 'available') sortOption = { availableCopies: -1 };

    // STEP 5: Query MongoDB
    const books = await Book.find(query).sort(sortOption);
    const totalCount = await Book.countDocuments();

    // STEP 6: Identify which books the logged-in member already has checked out
    let userBorrowedBookIds = [];
    if (req.user && req.user.role === 'member') {
      const userActiveLoans = await Loan.find({
        member: req.user._id,
        status: { $ne: 'returned' }
      }).select('book');
      userBorrowedBookIds = userActiveLoans.map(l => l.book.toString());
    }

    // STEP 7: Render the EJS template
    res.render('books/index', {
      title: 'Books Catalogue | Athenaeum',
      activeTab: 'catalogue',
      books,
      totalCount,
      selectedCategory: category || 'all',
      selectedAvailability: availability || 'all',
      selectedSort: sort || 'popularity',
      searchQuery: q || '',
      userBorrowedBookIds
    });
  } catch (err) {
    console.error('Catalogue error:', err);
    res.status(500).render('error', { message: 'Failed to load books catalogue.' });
  }
});

/**
 * ----------------------------------------------------------------------------
 * 2. GET /books/new - Show "Add New Book" Form (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.get('/new', requireRole('librarian'), (req, res) => {
  res.render('books/form', {
    title: 'Add New Book | Athenaeum',
    activeTab: 'catalogue',
    book: {},
    isEdit: false
  });
});

/**
 * ----------------------------------------------------------------------------
 * 3. POST /books - Handle "Add New Book" Submission (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.post('/', requireRole('librarian'), async (req, res) => {
  try {
    // STEP 1: Extract form inputs
    const { title, author, isbn, category, totalCopies, shelfLocation, year, description, coverStyle, coverUrl } = req.body;

    // STEP 2: Validate required fields
    if (!title || !author || !isbn || !category || !totalCopies) {
      req.session.flash = { type: 'error', message: 'Please fill in all required fields.' };
      return res.redirect('/books/new');
    }

    // STEP 3: Guardrail: Verify ISBN is unique
    const existing = await Book.findOne({ isbn: isbn.trim() });
    if (existing) {
      req.session.flash = { type: 'error', message: `A book with ISBN ${isbn} already exists.` };
      return res.redirect('/books/new');
    }

    // STEP 4: Insert book into database
    const copies = Math.max(1, Number(totalCopies));
    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category,
      totalCopies: copies,
      availableCopies: copies, // Initially all copies are on the shelf
      shelfLocation: shelfLocation ? shelfLocation.trim() : 'GENERAL-STACKS',
      year: Number(year) || new Date().getFullYear(),
      description: description ? description.trim() : '',
      coverStyle: coverStyle || 'tech-deep',
      coverUrl: coverUrl ? coverUrl.trim() : ''
    });

    // STEP 5: Create an audit log entry
    await Log.create({
      action: 'BOOK_ADDED',
      details: `Added new book: "${newBook.title}" (ISBN: ${newBook.isbn})`,
      user: req.user._id
    });

    // STEP 6: Flash success message and redirect
    req.session.flash = { type: 'success', message: `Added "${newBook.title}" to the catalogue.` };
    res.redirect('/books');
  } catch (err) {
    console.error('Add book error:', err);
    req.session.flash = { type: 'error', message: err.message || 'Error adding book.' };
    res.redirect('/books/new');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 4. GET /books/:id - Book Detail View
 * ----------------------------------------------------------------------------
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.session.flash = { type: 'error', message: 'Book not found.' };
      return res.redirect('/books');
    }

    // If a librarian is viewing, show who currently has active checkouts of this book
    let activeBorrowers = [];
    if (req.user && req.user.role === 'librarian') {
      activeBorrowers = await Loan.find({
        book: book._id,
        status: { $ne: 'returned' }
      }).populate('member', 'name email cardId');
    }

    // Check if the current member already has an active borrowed copy
    let isAlreadyBorrowedByCurrentUser = false;
    if (req.user && req.user.role === 'member') {
      const activeLoan = await Loan.findOne({
        book: book._id,
        member: req.user._id,
        status: { $ne: 'returned' }
      });
      isAlreadyBorrowedByCurrentUser = !!activeLoan;
    }

    res.render('books/detail', {
      title: `${book.title} | Athenaeum`,
      activeTab: 'catalogue',
      book,
      activeBorrowers,
      isAlreadyBorrowedByCurrentUser
    });
  } catch (err) {
    res.redirect('/books');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 5. GET /books/:id/edit - Show "Edit Book" Form (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.get('/:id/edit', requireRole('librarian'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.session.flash = { type: 'error', message: 'Book not found.' };
      return res.redirect('/books');
    }

    res.render('books/form', {
      title: `Edit: ${book.title} | Athenaeum`,
      activeTab: 'catalogue',
      book,
      isEdit: true
    });
  } catch (err) {
    res.redirect('/books');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 6. POST /books/:id - Handle Book Updates (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.post('/:id', requireRole('librarian'), async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies, shelfLocation, year, description, coverStyle, coverUrl } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      req.session.flash = { type: 'error', message: 'Book not found.' };
      return res.redirect('/books');
    }

    // Calculate copy difference if librarian changed the total copies
    const newTotal = Number(totalCopies);
    let newAvailable = book.availableCopies;
    if (!isNaN(newTotal) && newTotal !== book.totalCopies) {
      const diff = newTotal - book.totalCopies;
      newAvailable = Math.max(0, book.availableCopies + diff);
    }

    // Apply updates
    book.title = title.trim();
    book.author = author.trim();
    book.isbn = isbn.trim();
    book.category = category;
    book.totalCopies = isNaN(newTotal) ? book.totalCopies : newTotal;
    book.availableCopies = newAvailable;
    book.shelfLocation = shelfLocation ? shelfLocation.trim() : book.shelfLocation;
    book.year = Number(year) || book.year;
    book.description = description ? description.trim() : '';
    book.coverStyle = coverStyle || book.coverStyle;
    book.coverUrl = coverUrl ? coverUrl.trim() : '';

    await book.save();

    await Log.create({
      action: 'BOOK_UPDATED',
      details: `Updated details for "${book.title}"`,
      user: req.user._id
    });

    req.session.flash = { type: 'success', message: `Updated "${book.title}" successfully.` };
    res.redirect(`/books/${book._id}`);
  } catch (err) {
    console.error('Update book error:', err);
    req.session.flash = { type: 'error', message: 'Failed to update book.' };
    res.redirect(`/books/${req.params.id}/edit`);
  }
});

/**
 * ----------------------------------------------------------------------------
 * 7. POST /books/:id/delete - Delete a Book (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.post('/:id/delete', requireRole('librarian'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.session.flash = { type: 'error', message: 'Book not found.' };
      return res.redirect('/books');
    }

    // 🛡️ GUARDRAIL: Prevent deleting a book if copies are currently checked out!
    const activeLoans = await Loan.countDocuments({
      book: book._id,
      status: { $ne: 'returned' }
    });

    if (activeLoans > 0) {
      req.session.flash = {
        type: 'error',
        message: `Cannot delete "${book.title}": ${activeLoans} copy is currently checked out to patrons.`
      };
      return res.redirect('/books');
    }

    // Delete the book
    await Book.findByIdAndDelete(book._id);

    await Log.create({
      action: 'BOOK_DELETED',
      details: `Deleted book: "${book.title}"`,
      user: req.user._id
    });

    req.session.flash = { type: 'info', message: `Deleted "${book.title}" from the catalogue.` };
    res.redirect('/books');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Failed to delete book.' };
    res.redirect('/books');
  }
});

export default router;
