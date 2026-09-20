/**
 * date.js - Date Utilities & Calculation Helpers
 */

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Format a Date object to a human-readable string (e.g., "Sep 17, 2026")
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: options.month || 'short',
    day: options.day || 'numeric',
    year: options.year || 'numeric'
  });
}

/**
 * Format an ISO timestamp string to a human-readable time (e.g., "02:45 PM")
 */
export function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns integer days difference between two dates: ceil((d1 - d2) / msPerDay)
 */
export function getDaysDifference(targetDate, baseDate) {
  const d1 = typeof targetDate === 'string' ? new Date(targetDate + 'T23:59:59Z') : targetDate;
  const d2 = typeof baseDate === 'string' ? new Date(baseDate + 'T23:59:59Z') : baseDate;
  return Math.ceil((d1.getTime() - d2.getTime()) / ONE_DAY_MS);
}
