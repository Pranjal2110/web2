/**
 * ============================================================================
 * 👥 MEMBER & PATRON ROUTES (`src/routes/member.routes.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file manages patron profiles and member self-service:
 *   1. Patron Directory (`/members`): Librarians browse all registered patrons,
 *      see their card numbers, current loan counts, and unpaid fines.
 *   2. Patron Dossier (`/members/:id`): Librarians view a patron's complete
 *      historical borrowing ledger and settle their fines.
 *   3. Member Personal Portal (`/my-loans`): Logged-in patrons see their currently
 *      borrowed books, due date countdowns, overdue warnings, and return books.
 * ============================================================================
 */

import express from 'express';
import { User } from '../models/User.js';
import { Loan } from '../models/Loan.js';
import { Setting } from '../models/Setting.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { getSimulatedDate, evaluateLoanFine } from '../utils/fineCalculator.js';

const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * 1. GET /members - Patron Directory (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.get('/members', requireRole('librarian'), async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    // Keyword search matching name, email, or library card ID
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { cardId: regex }
      ];
    }

    // Fetch members sorted by role (librarians first, then patrons by creation date)
    const members = await User.find(query).sort({ role: -1, createdAt: -1 });
    const simDate = await getSimulatedDate();
    const settings = await Setting.findOne({ key: 'circulation_settings' });
    const fineRate = settings ? settings.fineRatePerDay : 0.75;

    // Attach real-time loan counts and unpaid fines to each member
    const membersWithStats = await Promise.all(members.map(async (m) => {
      let loans = await Loan.find({ member: m._id, status: { $ne: 'returned' } });
      loans = loans.map(l => evaluateLoanFine(l, simDate, fineRate));
      const activeCount = loans.length;
      const unpaidFines = loans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);

      return {
        ...m.toObject(),
        activeLoansCount: activeCount,
        unpaidFines
      };
    }));

    res.render('members/index', {
      title: 'Patron Directory | Athenaeum',
      activeTab: 'members',
      members: membersWithStats,
      searchQuery: q || ''
    });
  } catch (err) {
    console.error('Members directory error:', err);
    res.status(500).render('error', { message: 'Failed to load member records.' });
  }
});

/**
 * ----------------------------------------------------------------------------
 * 2. GET /members/:id - Patron Dossier & Full Borrowing History (Librarian Only)
 * ----------------------------------------------------------------------------
 */
router.get('/members/:id', requireRole('librarian'), async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      req.session.flash = { type: 'error', message: 'Patron record not found.' };
      return res.redirect('/members');
    }

    const simDate = await getSimulatedDate();
    const settings = await Setting.findOne({ key: 'circulation_settings' });
    const fineRate = settings ? settings.fineRatePerDay : 0.75;

    // Fetch all historical loans for this specific member
    let allLoans = await Loan.find({ member: member._id })
      .populate('book', 'title author isbn category')
      .sort({ createdAt: -1 });

    allLoans = allLoans.map(l => evaluateLoanFine(l, simDate, fineRate));

    const activeLoans = allLoans.filter(l => l.status !== 'returned');
    const returnedLoans = allLoans.filter(l => l.status === 'returned');
    const unpaidFines = activeLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);

    res.render('members/detail', {
      title: `${member.name} - Dossier | Athenaeum`,
      activeTab: 'members',
      member,
      activeLoans,
      returnedLoans,
      unpaidFines
    });
  } catch (err) {
    res.redirect('/members');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 3. GET /my-loans - Member Personal Portal ("My Borrowed Books")
 * ----------------------------------------------------------------------------
 */
router.get('/my-loans', requireRole('member'), async (req, res) => {
  try {
    const member = await User.findById(req.user._id);
    const simDate = await getSimulatedDate();
    const settings = await Setting.findOne({ key: 'circulation_settings' });
    const fineRate = settings ? settings.fineRatePerDay : 0.75;

    // Fetch loans belonging to the currently logged-in patron
    let loans = await Loan.find({ member: member._id })
      .populate('book', 'title author isbn category coverStyle coverUrl')
      .sort({ createdAt: -1 });

    // Calculate fines & overdue status
    loans = loans.map(l => evaluateLoanFine(l, simDate, fineRate));

    const activeLoans = loans.filter(l => l.status !== 'returned');
    const returnedLoans = loans.filter(l => l.status === 'returned');
    const unpaidFines = activeLoans.reduce((sum, l) => sum + (l.fineAccrued || 0), 0);

    res.render('circulation/my-loans', {
      title: 'My Borrowed Books | Athenaeum',
      activeTab: 'my-loans',
      member,
      activeLoans,
      returnedLoans,
      unpaidFines
    });
  } catch (err) {
    console.error('My loans error:', err);
    res.status(500).render('error', { message: 'Failed to load personal loans.' });
  }
});

export default router;
