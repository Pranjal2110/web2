/**
 * ============================================================================
 * 📊 DASHBOARD & ANALYTICS ROUTES (`src/routes/dashboard.routes.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file gathers live statistics from MongoDB to power the Library Dashboard:
 *   1. Total Books & Physical Inventory Copies.
 *   2. Currently Issued & Overdue Books count.
 *   3. Overdue fine totals (both unpaid fines and collected revenue).
 *   4. Most-Borrowed Titles (ranked popularity list).
 *   5. Category Distribution (proportions of computer science, literature, etc.).
 *   6. Recent Audit Activity Logs.
 * 
 * ❓ WHAT IS MONGODB AGGREGATION?
 * -------------------------------
 * Think of `aggregate` like an assembly line in a factory:
 *   - `$group`: Groups similar documents together (e.g. group all books by category).
 *   - `$sum`: Adds up numbers (e.g. calculate total physical copies across all books).
 * ============================================================================
 */

import express from 'express';
import { Book } from '../models/Book.js';
import { User } from '../models/User.js';
import { Loan } from '../models/Loan.js';
import { Log } from '../models/Log.js';
import { Setting } from '../models/Setting.js';
import { getSimulatedDate, evaluateLoanFine } from '../utils/fineCalculator.js';

const router = express.Router();

/**
 * GET / or /dashboard - Render Main Analytics Dashboard
 */
router.get(['/', '/dashboard'], async (req, res) => {
  try {
    const simDate = await getSimulatedDate();
    const settings = await Setting.findOne({ key: 'circulation_settings' });
    const fineRate = settings ? settings.fineRatePerDay : 0.75;

    // ------------------------------------------------------------------------
    // METRIC 1: Total Unique Book Titles
    // ------------------------------------------------------------------------
    const totalTitles = await Book.countDocuments();

    // ------------------------------------------------------------------------
    // METRIC 2: Total Physical Copies in Inventory
    // ------------------------------------------------------------------------
    const totalCopiesAgg = await Book.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCopies' } } }
    ]);
    const totalCopies = totalCopiesAgg[0]?.total || 0;

    // ------------------------------------------------------------------------
    // METRIC 3: Active and Overdue Loans
    // ------------------------------------------------------------------------
    let allLoans = await Loan.find()
      .populate('book', 'title isbn author category')
      .populate('member', 'name email cardId');

    // Dynamically evaluate overdue status against the simulated clock
    allLoans = allLoans.map(l => evaluateLoanFine(l, simDate, fineRate));

    const activeLoans = allLoans.filter(l => l.status !== 'returned');
    const overdueLoans = allLoans.filter(l => l.status === 'overdue');
    const issuedCopies = activeLoans.length;

    // Calculate percentage of total inventory currently in patron hands
    const utilizationPct = totalCopies > 0 ? Math.round((issuedCopies / totalCopies) * 100) : 0;

    // ------------------------------------------------------------------------
    // METRIC 4: Financials & Patron Counts
    // ------------------------------------------------------------------------
    const totalUnpaidFines = overdueLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);
    const users = await User.find();
    const totalCollectedFines = users.reduce((sum, u) => sum + (u.totalFinesPaid || 0), 0);
    const totalMembers = users.length;
    const activeBorrowersCount = new Set(activeLoans.map(l => l.member?._id.toString())).size;

    // ------------------------------------------------------------------------
    // METRIC 5: Top 5 Most-Borrowed Titles (Popularity Ranking)
    // ------------------------------------------------------------------------
    const mostBorrowed = await Book.find().sort({ borrowCount: -1 }).limit(5);

    // ------------------------------------------------------------------------
    // METRIC 6: Books Distribution by Discipline / Category
    // ------------------------------------------------------------------------
    const categoryAgg = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: '$totalCopies' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // ------------------------------------------------------------------------
    // METRIC 7: Recent Library Audit Activity Logs
    // ------------------------------------------------------------------------
    const recentLogs = await Log.find().sort({ timestamp: -1 }).limit(8);

    // Render the Dashboard EJS Template
    res.render('dashboard/index', {
      title: 'Dashboard & Analytics | Athenaeum',
      activeTab: 'dashboard',
      stats: {
        totalTitles,
        totalCopies,
        issuedCopies,
        utilizationPct,
        overdueCount: overdueLoans.length,
        totalUnpaidFines,
        totalCollectedFines,
        totalMembers,
        activeBorrowersCount
      },
      mostBorrowed,
      categoryStats: categoryAgg,
      overdueLoans,
      recentLogs
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard metrics.' });
  }
});

export default router;
