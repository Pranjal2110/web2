/**
 * ============================================================================
 * 🔄 CIRCULATION ROUTES & LOAN CONTROLLER (`src/routes/circulation.routes.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file is the "engine room" of the library. It handles:
 *   1. Members borrowing books (with 3 strict safety guardrails).
 *   2. Librarians issuing books directly to patrons.
 *   3. Returning books (and automatically putting copies back on the shelf).
 *   4. Calculating overdue fines and settling payments or waivers.
 *   5. Time Travel (+3, +7, +15 days) to test overdue loans in real-time.
 * 
 * 🛡️ THE 3 MANDATORY GUARDRAILS:
 * ------------------------------
 * Before issuing a book, the system MUST verify:
 *   👉 Guardrail 1: Are there copies available? (availableCopies > 0)
 *   👉 Guardrail 2: Is member under quota? (active loans < borrowLimit, usually 3)
 *   👉 Guardrail 3: Does member already have this book? (No duplicate checkouts)
 * ============================================================================
 */

import express from 'express';
import { Book } from '../models/Book.js';
import { User } from '../models/User.js';
import { Loan } from '../models/Loan.js';
import { Log } from '../models/Log.js';
import { Setting } from '../models/Setting.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { getSimulatedDate, evaluateLoanFine, ONE_DAY_MS } from '../utils/fineCalculator.js';

const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * 1. GET /circulation - Librarian Circulation Desk
 * ----------------------------------------------------------------------------
 */
router.get('/', requireRole('librarian'), async (req, res) => {
  try {
    const { status, q } = req.query;
    const simDate = await getSimulatedDate();
    const settings = await Setting.findOne({ key: 'circulation_settings' });
    const fineRate = settings ? settings.fineRatePerDay : 0.75;

    // STEP 1: Fetch all loans from MongoDB and populate book & member details
    let loans = await Loan.find()
      .populate('book', 'title isbn author category')
      .populate('member', 'name email cardId')
      .sort({ createdAt: -1 });

    // STEP 2: Dynamically calculate fines and overdue status against simulated date
    loans = loans.map(l => evaluateLoanFine(l, simDate, fineRate));

    // STEP 3: Filter by status tab (active / overdue / returned) if chosen
    if (status && status !== 'all') {
      loans = loans.filter(l => l.status === status);
    }

    // STEP 4: Filter by keyword search (book title or patron name)
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      loans = loans.filter(l => {
        const title = l.book ? l.book.title.toLowerCase() : '';
        const name = l.member ? l.member.name.toLowerCase() : '';
        return title.includes(term) || name.includes(term);
      });
    }

    // STEP 5: Calculate counts for navigation badges
    const allLoans = await Loan.find();
    const evaluatedAll = allLoans.map(l => evaluateLoanFine(l, simDate, fineRate));
    const countAll = evaluatedAll.length;
    const countActive = evaluatedAll.filter(l => l.status === 'active').length;
    const countOverdue = evaluatedAll.filter(l => l.status === 'overdue').length;
    const countReturned = evaluatedAll.filter(l => l.status === 'returned').length;

    // Fetch lists for the "Issue Book" modal
    const availableBooks = await Book.find({ availableCopies: { $gt: 0 } });
    const members = await User.find({ role: 'member', status: 'active' });

    res.render('circulation/index', {
      title: 'Circulation Desk | Athenaeum',
      activeTab: 'circulation',
      loans,
      currentFilter: status || 'all',
      searchQuery: q || '',
      counts: { all: countAll, active: countActive, overdue: countOverdue, returned: countReturned },
      availableBooks,
      members
    });
  } catch (err) {
    console.error('Circulation error:', err);
    res.status(500).render('error', { message: 'Failed to load circulation records.' });
  }
});

/**
 * ----------------------------------------------------------------------------
 * 2. POST /circulation/borrow/:bookId - Member Borrows a Book
 * ----------------------------------------------------------------------------
 */
router.post('/borrow/:bookId', requireRole('member'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    const member = await User.findById(req.user._id);

    if (!book) {
      req.session.flash = { type: 'error', message: 'Book not found.' };
      return res.redirect('/books');
    }

    // 🛡️ GUARDRAIL 1: Check if physical copies are available on the shelf
    if (book.availableCopies <= 0) {
      req.session.flash = {
        type: 'error',
        message: `Issue Rejected: All ${book.totalCopies} copies of "${book.title}" are currently checked out.`
      };
      return res.redirect(`/books/${book._id}`);
    }

    // 🛡️ GUARDRAIL 2: Check per-member borrowing quota (default max 3 books)
    const activeMemberLoansCount = await Loan.countDocuments({
      member: member._id,
      status: { $ne: 'returned' }
    });

    const limit = member.borrowLimit || 3;
    if (activeMemberLoansCount >= limit) {
      req.session.flash = {
        type: 'error',
        message: `Issue Rejected: You have reached your borrowing limit (${activeMemberLoansCount}/${limit} books). Return a book first.`
      };
      return res.redirect('/my-loans');
    }

    // 🛡️ GUARDRAIL 3: Prevent duplicate active checkout of the exact same title
    const alreadyBorrowing = await Loan.findOne({
      book: book._id,
      member: member._id,
      status: { $ne: 'returned' }
    });

    if (alreadyBorrowing) {
      req.session.flash = {
        type: 'warning',
        message: `Issue Rejected: You already have an active borrowed copy of "${book.title}".`
      };
      return res.redirect('/my-loans');
    }

    // STEP 4: Calculate loan issue and due dates (14 days from simulated date)
    const simDate = await getSimulatedDate();
    const dueDate = new Date(simDate.getTime() + 14 * ONE_DAY_MS);

    // STEP 5: Create the loan record in MongoDB
    await Loan.create({
      book: book._id,
      member: member._id,
      issueDate: simDate,
      dueDate: dueDate,
      status: 'active'
    });

    // STEP 6: Inventory Sync: Decrement available copies by 1 and increment borrow count
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.borrowCount = (book.borrowCount || 0) + 1;
    await book.save();

    // STEP 7: Create audit log
    await Log.create({
      action: 'BOOK_ISSUED',
      details: `Issued "${book.title}" to ${member.name}. Due on ${dueDate.toISOString().split('T')[0]}.`,
      user: member._id
    });

    req.session.flash = {
      type: 'success',
      message: `Success! You borrowed "${book.title}". Please return by ${dueDate.toLocaleDateString('en-US')}.`
    };
    res.redirect('/my-loans');
  } catch (err) {
    console.error('Borrow error:', err);
    req.session.flash = { type: 'error', message: 'Failed to borrow book.' };
    res.redirect('/books');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 3. POST /circulation/issue - Librarian Direct Issue to Patron
 * ----------------------------------------------------------------------------
 */
router.post('/issue', requireRole('librarian'), async (req, res) => {
  try {
    const { memberId, bookId, loanDuration, customDueDate } = req.body;

    const member = await User.findById(memberId);
    const book = await Book.findById(bookId);

    if (!member || !book) {
      req.session.flash = { type: 'error', message: 'Please select both a valid patron and book.' };
      return res.redirect('/circulation');
    }

    // 🛡️ Guardrail 1: Check availability
    if (book.availableCopies <= 0) {
      req.session.flash = { type: 'error', message: `Issue Rejected: "${book.title}" has 0 copies available.` };
      return res.redirect('/circulation');
    }

    // 🛡️ Guardrail 2: Check member quota
    const activeCount = await Loan.countDocuments({
      member: member._id,
      status: { $ne: 'returned' }
    });

    const limit = member.borrowLimit || 3;
    if (activeCount >= limit) {
      req.session.flash = {
        type: 'error',
        message: `Issue Rejected: Patron ${member.name} has reached their limit (${activeCount}/${limit} books).`
      };
      return res.redirect('/circulation');
    }

    // 🛡️ Guardrail 3: Check duplicate checkout
    const alreadyHas = await Loan.findOne({
      book: book._id,
      member: member._id,
      status: { $ne: 'returned' }
    });

    if (alreadyHas) {
      req.session.flash = {
        type: 'warning',
        message: `Issue Rejected: Patron ${member.name} already has an active copy of "${book.title}".`
      };
      return res.redirect('/circulation');
    }

    // Calculate due date
    const simDate = await getSimulatedDate();
    let dueDate;
    if (loanDuration === 'custom' && customDueDate) {
      dueDate = new Date(customDueDate + 'T23:59:59Z');
    } else {
      const days = Number(loanDuration) || 14;
      dueDate = new Date(simDate.getTime() + days * ONE_DAY_MS);
    }

    // Create loan
    await Loan.create({
      book: book._id,
      member: member._id,
      issueDate: simDate,
      dueDate: dueDate,
      status: 'active'
    });

    // Auto-decrement available copies
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.borrowCount = (book.borrowCount || 0) + 1;
    await book.save();

    await Log.create({
      action: 'BOOK_ISSUED',
      details: `Librarian issued "${book.title}" to ${member.name}.`,
      user: req.user._id
    });

    req.session.flash = { type: 'success', message: `Issued "${book.title}" to ${member.name}.` };
    res.redirect('/circulation');
  } catch (err) {
    console.error('Direct issue error:', err);
    req.session.flash = { type: 'error', message: 'Failed to issue book.' };
    res.redirect('/circulation');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 4. POST /circulation/return/:loanId - Return a Book
 * ----------------------------------------------------------------------------
 */
router.post('/return/:loanId', requireAuth, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId).populate('book member');
    if (!loan) {
      req.session.flash = { type: 'error', message: 'Loan record not found.' };
      return res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
    }

    if (loan.status === 'returned') {
      req.session.flash = { type: 'info', message: 'This book has already been returned.' };
      return res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
    }

    const simDate = await getSimulatedDate();
    const settings = await Setting.findOne({ key: 'circulation_settings' });
    const fineRate = settings ? settings.fineRatePerDay : 0.75;

    // STEP 1: Calculate any final overdue fine at the moment of return
    const diffMs = simDate.getTime() - new Date(loan.dueDate).getTime();
    let finalFine = 0;
    if (diffMs > 0) {
      const daysOverdue = Math.ceil(diffMs / ONE_DAY_MS);
      finalFine = Number((daysOverdue * fineRate).toFixed(2));
    }

    // STEP 2: Inventory Sync: Put physical copy back on shelf (+1 availableCopies)
    const book = await Book.findById(loan.book._id);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    // STEP 3: Update loan record to returned status
    loan.returnDate = simDate;
    loan.status = 'returned';
    loan.fineAccrued = finalFine;
    if (finalFine === 0) {
      loan.finePaid = true;
    }
    await loan.save();

    await Log.create({
      action: 'BOOK_RETURNED',
      details: `Returned "${book ? book.title : 'Book'}". Accrued fine: $${finalFine.toFixed(2)}`,
      user: req.user._id
    });

    if (finalFine > 0) {
      req.session.flash = {
        type: 'warning',
        message: `Book returned! An overdue fine of $${finalFine.toFixed(2)} was recorded.`
      };
    } else {
      req.session.flash = {
        type: 'success',
        message: `Successfully returned "${book ? book.title : 'Book'}". Inventory copy replenished!`
      };
    }

    res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
  } catch (err) {
    console.error('Return error:', err);
    req.session.flash = { type: 'error', message: 'Failed to return book.' };
    res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 5. POST /circulation/settle-fine/:loanId - Settle Fine (Pay or Waive)
 * ----------------------------------------------------------------------------
 */
router.post('/settle-fine/:loanId', requireAuth, async (req, res) => {
  try {
    const { action } = req.body; // 'pay' (cash payment) or 'waive' (librarian pardon)
    const loan = await Loan.findById(req.params.loanId).populate('book member');
    if (!loan) {
      req.session.flash = { type: 'error', message: 'Loan record not found.' };
      return res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
    }

    const fineAmount = loan.fineAccrued || 0;

    if (action === 'waive') {
      // Only librarians are allowed to forgive/waive fines
      if (req.user.role !== 'librarian') {
        req.session.flash = { type: 'error', message: 'Only staff librarians can waive fines.' };
        return res.redirect('/my-loans');
      }
      loan.fineAccrued = 0;
      loan.finePaid = true;
      await loan.save();

      await Log.create({
        action: 'FINE_WAIVED',
        details: `Librarian waived fine of $${fineAmount.toFixed(2)} for ${loan.member.name}.`,
        user: req.user._id
      });

      req.session.flash = { type: 'info', message: `Waived fine of $${fineAmount.toFixed(2)}.` };
    } else {
      // Patron pays the fine
      loan.finePaid = true;
      await loan.save();

      const member = await User.findById(loan.member._id);
      if (member) {
        member.totalFinesPaid = (member.totalFinesPaid || 0) + fineAmount;
        await member.save();
      }

      await Log.create({
        action: 'FINE_PAID',
        details: `Fine of $${fineAmount.toFixed(2)} paid for loan of "${loan.book.title}".`,
        user: req.user._id
      });

      req.session.flash = { type: 'success', message: `Payment of $${fineAmount.toFixed(2)} received and fine cleared!` };
    }

    res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
  } catch (err) {
    console.error('Fine settle error:', err);
    req.session.flash = { type: 'error', message: 'Failed to settle fine.' };
    res.redirect(req.user.role === 'librarian' ? '/circulation' : '/my-loans');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 6. POST /simulation/advance - Time Machine Control (+3d, +7d, +15d, reset)
 * ----------------------------------------------------------------------------
 */
router.post('/simulation/advance', requireAuth, async (req, res) => {
  try {
    const { days } = req.body;
    let setting = await Setting.findOne({ key: 'circulation_settings' });
    if (!setting) {
      setting = await Setting.create({ key: 'circulation_settings' });
    }

    if (Number(days) === 0) {
      setting.simulatedDaysOffset = 0;
      req.session.flash = { type: 'info', message: 'Circulation clock reset to baseline date.' };
    } else {
      setting.simulatedDaysOffset = (setting.simulatedDaysOffset || 0) + Number(days);
      req.session.flash = {
        type: 'info',
        message: `Fast-forwarded simulation by +${days} days! Overdue statuses & fines recalculated.`
      };
    }

    await setting.save();

    await Log.create({
      action: 'TIME_TRAVEL',
      details: `Fast-forwarded simulation by ${days} days. Total offset: +${setting.simulatedDaysOffset} days.`,
      user: req.user._id
    });

    // Return user to whichever page they were viewing
    res.redirect(req.get('Referrer') || '/dashboard');
  } catch (err) {
    console.error('Time travel error:', err);
    res.redirect('/dashboard');
  }
});

export default router;
