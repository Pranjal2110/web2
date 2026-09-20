/**
 * ============================================================================
 * ⚙️ SYSTEM SETTINGS & SIMULATION CLOCK MODEL (`src/models/Setting.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file stores global system configurations and the "Time Machine" clock.
 * 
 * ❓ WHY DO WE HAVE A "TIME MACHINE"?
 * ----------------------------------
 * In a library, books are normally borrowed for 14 days, and overdue fines
 * only appear weeks later. To allow developers, evaluators, and teachers
 * to test overdue fines immediately without waiting 2 weeks in real life,
 * our system includes a simulated time offset!
 * 
 * When someone clicks "+7 Days" or "+15 Days":
 *   - `simulatedDaysOffset` increases by 7 or 15.
 *   - The library's clock jumps forward into the future.
 *   - Any loans past their due date instantly switch to `overdue` and show fines!
 * ============================================================================
 */

import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  // Unique setting identifier (e.g., 'circulation_settings')
  key: {
    type: String,
    required: true,
    unique: true
  },

  // Number of days to fast-forward the library simulation clock into the future
  simulatedDaysOffset: {
    type: Number,
    default: 0
  },

  // Daily overdue penalty in dollars (e.g., $0.75 per overdue day)
  fineRatePerDay: {
    type: Number,
    default: 0.75
  },

  // Standard loan period for patrons before a book is considered overdue
  defaultLoanDays: {
    type: Number,
    default: 14
  },

  // Baseline date from which simulated days are added
  baseDate: {
    type: Date,
    default: () => new Date('2026-09-17T12:00:00Z')
  }
});

export const Setting = mongoose.model('Setting', settingSchema);
