/**
 * ============================================================================
 * 💰 FINE CALCULATOR & DATE UTILITIES (`src/utils/fineCalculator.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file contains math and date calculation functions for:
 *   1. Calculating how many days a book is overdue.
 *   2. Computing the exact overdue penalty ($0.75 per day).
 *   3. Calculating the simulated "Time Machine" date.
 *   4. Formatting date timestamps into clean readable text (e.g. "Oct 2, 2026").
 * 
 * ❓ HOW DOES THE FINE MATH WORK?
 * -------------------------------
 * Example:
 *   - Book Due Date:       September 20
 *   - Today (Simulated):   September 25
 *   - Difference:          5 days late
 *   - Daily Fine Rate:     $0.75 / day
 *   - Total Fine:          5 * $0.75 = $3.75
 * ============================================================================
 */

import { Setting } from '../models/Setting.js';

// Number of milliseconds in one 24-hour day (24 hours * 60 mins * 60 secs * 1000 ms = 86,400,000 ms)
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ⚙️ 1. GET SYSTEM SETTINGS
 * Retrieves the global circulation settings document from MongoDB.
 * If it doesn't exist yet, creates one with sensible default values.
 */
export async function getSystemSettings() {
  let setting = await Setting.findOne({ key: 'circulation_settings' });
  if (!setting) {
    setting = await Setting.create({
      key: 'circulation_settings',
      simulatedDaysOffset: 0,
      fineRatePerDay: 0.75, // $0.75 per day
      defaultLoanDays: 14,   // 2 weeks
      baseDate: new Date('2026-09-17T12:00:00Z')
    });
  }
  return setting;
}

/**
 * ⏱️ 2. GET SIMULATED DATE
 * Calculates what date the library is currently pretending it is.
 * Formula: baseline date + (offset in days * milliseconds in a day)
 */
export async function getSimulatedDate() {
  const settings = await getSystemSettings();
  const baseMs = new Date(settings.baseDate).getTime();
  const offsetMs = (settings.simulatedDaysOffset || 0) * ONE_DAY_MS;
  return new Date(baseMs + offsetMs);
}

/**
 * 💵 3. EVALUATE LOAN FINE & OVERDUE STATUS
 * Checks whether a given loan is overdue relative to the simulated date,
 * and calculates any fine that has accumulated.
 * 
 * @param {Object} loan - The loan record from the database
 * @param {Date} simulatedDate - The current simulated date
 * @param {number} fineRate - The cost per overdue day (defaults to $0.75)
 * @returns {Object} The updated loan object with .status, .daysOverdue, and .fineAccrued
 */
export function evaluateLoanFine(loan, simulatedDate, fineRate = 0.75) {
  // If the book was already returned, the loan is finished and its fine is fixed
  if (loan.status === 'returned') {
    return loan;
  }

  const dueDate = new Date(loan.dueDate);
  // Calculate difference in time between current date and due date
  const diffMs = simulatedDate.getTime() - dueDate.getTime();

  // If diffMs > 0, the current date is PAST the due date!
  if (diffMs > 0) {
    // Round up partial days to the next full day
    const daysOverdue = Math.ceil(diffMs / ONE_DAY_MS);
    // Multiply days by fine rate and format to 2 decimal places
    const fine = Number((daysOverdue * fineRate).toFixed(2));

    loan.status = 'overdue';
    loan.daysOverdue = daysOverdue;
    loan.fineAccrued = fine;
  } else {
    // Current date is before or on the due date: loan is in good standing
    loan.status = 'active';
    loan.daysOverdue = 0;
    loan.fineAccrued = 0;
  }

  return loan;
}

/**
 * 📅 4. FORMAT DATE FOR HUMANS
 * Formats a Date object into human-friendly text.
 * Example: new Date('2026-10-02') -> "Oct 2, 2026"
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
