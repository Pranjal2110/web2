/**
 * store.js - Central Reactive State Store
 * Handles book catalogue, member records, loan circulation, and automated fines.
 */

import { storage } from './storage.js';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  SEED_BOOKS,
  SEED_MEMBERS,
  SEED_LOANS,
  SEED_LOGS
} from './constants.js';
import { ONE_DAY_MS, formatDate } from '../utils/date.js';

class Store {
  constructor() {
    this.subscribers = new Set();
    this.initStore();
  }

  initStore() {
    if (!storage.getItem(STORAGE_KEYS.BOOKS)) {
      this.resetToDefaults();
    }
  }

  resetToDefaults() {
    storage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(SEED_BOOKS));
    storage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(SEED_MEMBERS));
    storage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(SEED_LOANS));
    storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    storage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_LOGS));
    storage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, 'u1'); // Default to Eleanor (Librarian)
    this.notify();
  }

  // Pub/Sub
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(); } catch (err) { console.error('Subscriber error:', err); }
    });
  }

  // --- Settings & Time Travel Simulation ---
  getSettings() {
    const raw = storage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : { ...DEFAULT_SETTINGS };
  }

  updateSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notify();
  }

  getSimulatedDate() {
    const settings = this.getSettings();
    const base = new Date(settings.baseDate + 'T12:00:00Z');
    const offsetMs = (settings.simulatedDaysOffset || 0) * ONE_DAY_MS;
    return new Date(base.getTime() + offsetMs);
  }

  getSimulatedDateFormatted() {
    return formatDate(this.getSimulatedDate());
  }

  advanceSimulatedDays(days) {
    const current = this.getSettings();
    const newOffset = (current.simulatedDaysOffset || 0) + Number(days);
    this.updateSettings({ simulatedDaysOffset: newOffset });
    this.addLog('TIME_TRAVEL', `Fast-forwarded simulation by +${days} days. Date is now ${this.getSimulatedDateFormatted()}`);
  }

  resetSimulatedDate() {
    this.updateSettings({ simulatedDaysOffset: 0 });
    this.addLog('TIME_TRAVEL', `Reset circulation clock to base date (${this.getSimulatedDateFormatted()})`);
  }

  // --- Books Management ---
  getBooks() {
    const raw = storage.getItem(STORAGE_KEYS.BOOKS);
    return raw ? JSON.parse(raw) : [];
  }

  saveBooks(books) {
    storage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notify();
  }

  getBookById(bookId) {
    return this.getBooks().find(b => b.id === bookId) || null;
  }

  addBook(bookData) {
    const books = this.getBooks();
    const newBook = {
      id: 'b-' + Date.now(),
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      isbn: bookData.isbn.trim(),
      category: bookData.category,
      totalCopies: Number(bookData.totalCopies) || 1,
      availableCopies: Number(bookData.totalCopies) || 1,
      shelfLocation: bookData.shelfLocation ? bookData.shelfLocation.trim() : 'MAIN-001',
      year: Number(bookData.year) || new Date().getFullYear(),
      description: bookData.description ? bookData.description.trim() : '',
      coverStyle: bookData.coverStyle || 'tech-deep',
      coverUrl: bookData.coverUrl || '',
      borrowCount: 0
    };
    books.unshift(newBook);
    this.saveBooks(books);
    this.addLog('BOOK_ADDED', `Added new book: "${newBook.title}" (ISBN: ${newBook.isbn})`);
    return newBook;
  }

  updateBook(bookId, updates) {
    const books = this.getBooks();
    const idx = books.findIndex(b => b.id === bookId);
    if (idx === -1) return false;

    const current = books[idx];
    const newTotal = Number(updates.totalCopies);

    let newAvailable = current.availableCopies;
    if (!isNaN(newTotal) && newTotal !== current.totalCopies) {
      const diff = newTotal - current.totalCopies;
      newAvailable = Math.max(0, current.availableCopies + diff);
    }

    books[idx] = {
      ...current,
      ...updates,
      totalCopies: isNaN(newTotal) ? current.totalCopies : newTotal,
      availableCopies: newAvailable
    };

    this.saveBooks(books);
    this.addLog('BOOK_UPDATED', `Updated details for "${books[idx].title}"`);
    return true;
  }

  deleteBook(bookId) {
    const books = this.getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return { success: false, message: 'Book not found.' };

    const activeLoans = this.getLoans().filter(l => l.bookId === bookId && l.status !== 'returned');
    if (activeLoans.length > 0) {
      return {
        success: false,
        message: `Cannot delete "${book.title}": ${activeLoans.length} copy is currently checked out.`
      };
    }

    const filtered = books.filter(b => b.id !== bookId);
    this.saveBooks(filtered);
    this.addLog('BOOK_DELETED', `Deleted book: "${book.title}"`);
    return { success: true };
  }

  // --- Members Management ---
  getMembers() {
    const raw = storage.getItem(STORAGE_KEYS.MEMBERS);
    return raw ? JSON.parse(raw) : [];
  }

  saveMembers(members) {
    storage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    this.notify();
  }

  getMemberById(memberId) {
    return this.getMembers().find(m => m.id === memberId) || null;
  }

  addMember(memberData) {
    const members = this.getMembers();
    const newMember = {
      id: 'u-' + Date.now(),
      name: memberData.name.trim(),
      email: memberData.email.trim(),
      cardId: 'MEM-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      role: memberData.role || 'member',
      borrowLimit: Number(memberData.borrowLimit) || 3,
      activeLoansCount: 0,
      totalFinesPaid: 0,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    members.push(newMember);
    this.saveMembers(members);
    this.addLog('MEMBER_REGISTERED', `Registered patron ${newMember.name} (${newMember.cardId})`);
    return newMember;
  }

  // --- Active Session Management ---
  getActiveUserId() {
    return storage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'u1';
  }

  getActiveUser() {
    const id = this.getActiveUserId();
    return this.getMemberById(id) || this.getMembers()[0];
  }

  setActiveUserId(userId) {
    storage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
    this.notify();
  }

  // --- Loans & Circulation ---
  getLoans() {
    const raw = storage.getItem(STORAGE_KEYS.LOANS);
    const loans = raw ? JSON.parse(raw) : [];
    return this.evaluateDynamicLoanFines(loans);
  }

  saveLoans(loans) {
    storage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    this.notify();
  }

  evaluateDynamicLoanFines(loans) {
    const simDate = this.getSimulatedDate();
    const fineRate = this.getSettings().fineRatePerDay;

    return loans.map(loan => {
      if (loan.status === 'returned') {
        return loan;
      }

      const due = new Date(loan.dueDate + 'T23:59:59Z');
      const diffMs = simDate.getTime() - due.getTime();

      if (diffMs > 0) {
        const daysOverdue = Math.ceil(diffMs / ONE_DAY_MS);
        const fine = Number((daysOverdue * fineRate).toFixed(2));
        return {
          ...loan,
          status: 'overdue',
          daysOverdue,
          fineAccrued: fine
        };
      } else {
        return {
          ...loan,
          status: 'active',
          daysOverdue: 0,
          fineAccrued: 0
        };
      }
    });
  }

  issueBook({ bookId, memberId, loanDays = 14, customDueDate = null }) {
    const book = this.getBookById(bookId);
    const member = this.getMemberById(memberId);

    if (!book) return { success: false, message: 'Book record not found.' };
    if (!member) return { success: false, message: 'Member record not found.' };

    // Validation Rule 1: Zero available copies check
    if (book.availableCopies <= 0) {
      return {
        success: false,
        message: `Issue Rejected: All ${book.totalCopies} copies of "${book.title}" are currently checked out.`
      };
    }

    // Active loans for member
    const activeMemberLoans = this.getLoans().filter(
      l => l.memberId === memberId && l.status !== 'returned'
    );

    // Validation Rule 2: Per-member borrowing limit check
    const limit = member.borrowLimit || 3;
    if (activeMemberLoans.length >= limit) {
      return {
        success: false,
        message: `Issue Rejected: Patron ${member.name} has reached the borrowing limit (${activeMemberLoans.length}/${limit} books).`
      };
    }

    // Validation Rule 3: Prevent duplicate active checkout of same title
    const alreadyBorrowing = activeMemberLoans.some(l => l.bookId === bookId);
    if (alreadyBorrowing) {
      return {
        success: false,
        message: `Issue Rejected: Patron ${member.name} already has an active borrowed copy of "${book.title}".`
      };
    }

    // Dates
    const simDate = this.getSimulatedDate();
    const issueDateStr = simDate.toISOString().split('T')[0];

    let dueDateStr = '';
    if (customDueDate) {
      dueDateStr = customDueDate;
    } else {
      const dueTarget = new Date(simDate.getTime() + (Number(loanDays) * ONE_DAY_MS));
      dueDateStr = dueTarget.toISOString().split('T')[0];
    }

    const newLoan = {
      id: 'ln-' + Date.now().toString().slice(-6),
      bookId,
      memberId,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'active',
      fineAccrued: 0,
      finePaid: false
    };

    // Auto-decrement available copies
    const books = this.getBooks().map(b => {
      if (b.id === bookId) {
        return {
          ...b,
          availableCopies: Math.max(0, b.availableCopies - 1),
          borrowCount: (b.borrowCount || 0) + 1
        };
      }
      return b;
    });

    // Update member active loans count
    const members = this.getMembers().map(m => {
      if (m.id === memberId) {
        return { ...m, activeLoansCount: (m.activeLoansCount || 0) + 1 };
      }
      return m;
    });

    const loans = this.getLoans();
    loans.unshift(newLoan);

    this.saveBooks(books);
    this.saveMembers(members);
    this.saveLoans(loans);

    this.addLog(
      'BOOK_ISSUED',
      `Issued "${book.title}" to ${member.name}. Due on ${dueDateStr}. Available copies remaining: ${book.availableCopies - 1}`
    );

    return { success: true, loan: newLoan };
  }

  returnBook(loanId, { waiveFine = false, payFineNow = false } = {}) {
    const loans = this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: 'Loan record not found.' };
    if (loan.status === 'returned') return { success: false, message: 'Book is already returned.' };

    const book = this.getBookById(loan.bookId);
    const member = this.getMemberById(loan.memberId);
    const simDate = this.getSimulatedDate();
    const returnDateStr = simDate.toISOString().split('T')[0];

    const due = new Date(loan.dueDate + 'T23:59:59Z');
    const diffMs = simDate.getTime() - due.getTime();
    let finalFine = 0;
    if (diffMs > 0) {
      const daysOverdue = Math.ceil(diffMs / ONE_DAY_MS);
      finalFine = Number((daysOverdue * this.getSettings().fineRatePerDay).toFixed(2));
    }

    if (book) {
      const books = this.getBooks().map(b => {
        if (b.id === loan.bookId) {
          return {
            ...b,
            availableCopies: Math.min(b.totalCopies, b.availableCopies + 1)
          };
        }
        return b;
      });
      this.saveBooks(books);
    }

    if (member) {
      const members = this.getMembers().map(m => {
        if (m.id === loan.memberId) {
          return {
            ...m,
            activeLoansCount: Math.max(0, (m.activeLoansCount || 1) - 1),
            totalFinesPaid: (m.totalFinesPaid || 0) + (payFineNow ? finalFine : 0)
          };
        }
        return m;
      });
      this.saveMembers(members);
    }

    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          returnDate: returnDateStr,
          status: 'returned',
          fineAccrued: waiveFine ? 0 : finalFine,
          finePaid: waiveFine ? true : payFineNow
        };
      }
      return l;
    });

    this.saveLoans(updatedLoans);

    this.addLog(
      'BOOK_RETURNED',
      `Returned "${book ? book.title : 'Book'}". Fine: $${finalFine.toFixed(2)}${waiveFine ? ' (Waived)' : payFineNow ? ' (Paid)' : ''}`
    );

    return {
      success: true,
      fineAccrued: finalFine,
      waived: waiveFine,
      paid: payFineNow
    };
  }

  settleFine(loanId, action = 'pay') {
    const loans = this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: 'Loan not found.' };

    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          finePaid: true,
          fineAccrued: action === 'waive' ? 0 : l.fineAccrued
        };
      }
      return l;
    });

    if (action === 'pay') {
      const members = this.getMembers().map(m => {
        if (m.id === loan.memberId) {
          return {
            ...m,
            totalFinesPaid: (m.totalFinesPaid || 0) + (loan.fineAccrued || 0)
          };
        }
        return m;
      });
      this.saveMembers(members);
    }

    this.saveLoans(updatedLoans);
    this.addLog(
      'FINE_SETTLED',
      `${action === 'waive' ? 'Waived' : 'Collected'} fine of $${loan.fineAccrued.toFixed(2)} for loan ${loan.id}`
    );

    return { success: true };
  }

  // --- Audit Logs ---
  getLogs() {
    const raw = storage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  addLog(action, details) {
    const logs = this.getLogs();
    logs.unshift({
      id: 'log-' + Date.now(),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (logs.length > 50) logs.pop();
    storage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    this.notify();
  }

  clearLogs() {
    storage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    this.notify();
  }
}

export const store = new Store();
