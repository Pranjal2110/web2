/**
 * ============================================================================
 * ⏱️ SIMULATION CLOCK MIDDLEWARE (`src/middlewares/simulation.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This middleware injects the library's current "Simulated Date" into every
 * EJS web page rendered by the server.
 * 
 * ❓ WHY DO WE NEED THIS?
 * -----------------------
 * The header of the library website includes a live "Time Machine" widget
 * that shows the simulated library date (e.g., "Oct 2, 2026").
 * By attaching `simulatedDate` to `res.locals`, every page header can display
 * the exact simulated date without repeating database queries in every single route!
 * ============================================================================
 */

import { getSimulatedDate, formatDate } from '../utils/fineCalculator.js';

export async function loadSimulationClock(req, res, next) {
  try {
    // 1. Calculate the simulated date from database settings
    const simDate = await getSimulatedDate();

    // 2. Make the date object and human-friendly string available to all EJS views
    res.locals.simulatedDate = simDate;
    res.locals.simulatedDateFormatted = formatDate(simDate);
  } catch (err) {
    // If an error occurs, safely fallback to the computer's real-time clock
    res.locals.simulatedDate = new Date();
    res.locals.simulatedDateFormatted = formatDate(new Date());
  }

  // Continue to the next middleware or route
  next();
}
