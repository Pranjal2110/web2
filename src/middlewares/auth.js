/**
 * ============================================================================
 * 🛡️ AUTHENTICATION & ROLE AUTHORIZATION MIDDLEWARE (`src/middlewares/auth.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS MIDDLEWARE?
 * ----------------------
 * Think of middleware like a security guard standing at the door of a room:
 *   1. A browser sends a request to visit a web page (e.g. `/books/new`).
 *   2. Before reaching the route handler, the request passes through this middleware.
 *   3. The middleware checks: "Are you logged in? Are you a librarian?"
 *   4. If YES: it calls `next()` to let the request inside.
 *   5. If NO: it stops the request and redirects them to the `/login` page!
 * 
 * ❓ WHAT IS `res.locals`?
 * -----------------------
 * `res.locals` is an object provided by Express. Any variables placed on `res.locals`
 * (like `res.locals.currentUser`) can be directly accessed in your EJS HTML templates
 * without having to manually pass them into every `res.render()` call!
 * ============================================================================
 */

import { User } from '../models/User.js';

/**
 * 👤 1. LOAD USER SESSION MIDDLEWARE
 * Runs on EVERY web request.
 * - Reads the user ID stored in the session cookie.
 * - Fetches their user details from MongoDB.
 * - Attaches them to `req.user` and `res.locals.currentUser`.
 * - Handles one-time "flash messages" (e.g., success or error notifications).
 */
export async function loadUserSession(req, res, next) {
  // Initialize defaults
  res.locals.currentUser = null;
  res.locals.flash = req.session.flash || null;

  // Clear the flash message after reading it so it only displays once
  delete req.session.flash;

  // Check if a user ID is saved in the session (meaning the user logged in)
  if (req.session && req.session.userId) {
    try {
      // Find the user in the database (omit the hashed password for security)
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;               // Available in backend route handlers via req.user
        res.locals.currentUser = user; // Available in front-end EJS templates via currentUser
      } else {
        // If the user ID in the cookie doesn't exist in DB anymore, clear it
        delete req.session.userId;
      }
    } catch (err) {
      console.error('Error loading session user:', err);
    }
  }

  // Continue to the next middleware or route
  next();
}

/**
 * 🔒 2. REQUIRE AUTHENTICATION
 * Use this guard on any route that requires a logged-in user.
 * If the visitor is not logged in, redirects them to /login.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    req.session.flash = {
      type: 'warning',
      message: 'Please log in to access that page.'
    };
    return res.redirect('/login');
  }
  // User is authenticated, proceed!
  next();
}

/**
 * 👑 3. REQUIRE SPECIFIC ROLE ('librarian' or 'member')
 * Use this guard to protect role-specific actions.
 * For example:
 *   - Only librarians can add books (`requireRole('librarian')`)
 *   - Only patrons can borrow books (`requireRole('member')`)
 */
export function requireRole(role) {
  return (req, res, next) => {
    // First, verify the user is logged in at all
    if (!req.user) {
      req.session.flash = {
        type: 'warning',
        message: 'Please log in to access that page.'
      };
      return res.redirect('/login');
    }

    // Next, check if their role matches the requirement
    if (req.user.role !== role) {
      req.session.flash = {
        type: 'error',
        message: `Access Denied: That action requires ${role.toUpperCase()} privileges.`
      };
      // Redirect safely to their appropriate home page
      return res.redirect(req.user.role === 'librarian' ? '/dashboard' : '/books');
    }

    // Role check passed, proceed to the route handler!
    next();
  };
}
