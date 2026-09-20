/**
 * ============================================================================
 * 🔐 AUTHENTICATION ROUTES (`src/routes/auth.routes.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file handles user accounts and sessions:
 *   - Showing the Login and Register forms
 *   - Validating login credentials and starting a session
 *   - Registering new patrons with automatic library card numbers
 *   - Logging out (destroying the session)
 *   - Providing a 1-click Demo Persona switcher for quick testing and grading
 * 
 * ❓ HOW DO SESSIONS WORK FOR BEGINNERS?
 * -------------------------------------
 * 1. User submits their email and password.
 * 2. If valid, we store their user ID in `req.session.userId`.
 * 3. Express automatically sends a secure cookie to the user's browser.
 * 4. On future page visits, the browser sends that cookie back, and our server
 *    knows who is logged in!
 * ============================================================================
 */

import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * 1. GET /login - Show the Login Page
 * ----------------------------------------------------------------------------
 */
router.get('/login', (req, res) => {
  // If the user is already logged in, redirect them to their home screen
  if (req.user) {
    return res.redirect(req.user.role === 'librarian' ? '/dashboard' : '/books');
  }

  // Render the login HTML template (src/views/auth/login.ejs)
  res.render('auth/login', {
    title: 'Login | Athenaeum Library',
    activeTab: 'login'
  });
});

/**
 * ----------------------------------------------------------------------------
 * 2. POST /login - Handle Login Form Submission
 * ----------------------------------------------------------------------------
 */
router.post('/login', async (req, res) => {
  try {
    // STEP 1: Extract email and password submitted by the user
    const { email, password } = req.body;

    // STEP 2: Validate that neither field was left empty
    if (!email || !password) {
      req.session.flash = { type: 'error', message: 'Please enter both email and password.' };
      return res.redirect('/login');
    }

    // STEP 3: Look for a user with this email in the database
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.session.flash = { type: 'error', message: 'Invalid credentials. User not found.' };
      return res.redirect('/login');
    }

    // STEP 4: Check if the entered password matches the encrypted password in MongoDB
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      req.session.flash = { type: 'error', message: 'Invalid credentials. Password incorrect.' };
      return res.redirect('/login');
    }

    // STEP 5: Success! Save user's ID into their session
    req.session.userId = user._id;
    req.session.flash = { type: 'success', message: `Welcome back, ${user.name}!` };

    // STEP 6: Redirect to the appropriate dashboard based on their role
    res.redirect(user.role === 'librarian' ? '/dashboard' : '/books');
  } catch (err) {
    console.error('Login error:', err);
    req.session.flash = { type: 'error', message: 'Server error during login. Please try again.' };
    res.redirect('/login');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 3. GET /register - Show the Registration Page
 * ----------------------------------------------------------------------------
 */
router.get('/register', (req, res) => {
  res.render('auth/register', {
    title: 'Register Patron Account | Athenaeum',
    activeTab: 'register'
  });
});

/**
 * ----------------------------------------------------------------------------
 * 4. POST /register - Handle Registration Form Submission
 * ----------------------------------------------------------------------------
 */
router.post('/register', async (req, res) => {
  try {
    // STEP 1: Extract form inputs
    const { name, email, password, role, borrowLimit } = req.body;

    // STEP 2: Ensure required fields are provided
    if (!name || !email || !password) {
      req.session.flash = { type: 'error', message: 'Please fill in all required fields.' };
      return res.redirect('/register');
    }

    // STEP 3: Check if this email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.session.flash = { type: 'error', message: 'An account with that email already exists.' };
      return res.redirect('/register');
    }

    // STEP 4: Generate a unique library card number (e.g. "MEM-2026-482")
    const prefix = role === 'librarian' ? 'LIB' : 'MEM';
    const cardId = `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // STEP 5: Create the new user in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Note: userSchema pre('save') hook will hash this before saving!
      cardId,
      role: role === 'librarian' ? 'librarian' : 'member',
      borrowLimit: Number(borrowLimit) || 3
    });

    // STEP 6: Automatically log the new user in
    req.session.userId = newUser._id;
    req.session.flash = { type: 'success', message: `Account created! Welcome, ${newUser.name}.` };
    res.redirect(newUser.role === 'librarian' ? '/dashboard' : '/books');
  } catch (err) {
    console.error('Registration error:', err);
    req.session.flash = { type: 'error', message: 'Server error during registration.' };
    res.redirect('/register');
  }
});

/**
 * ----------------------------------------------------------------------------
 * 5. GET /logout - Log Out the Current User
 * ----------------------------------------------------------------------------
 */
router.get('/logout', (req, res) => {
  // Destroy the session in MongoDB and delete the browser cookie
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

/**
 * ----------------------------------------------------------------------------
 * 6. GET /auth/demo/:persona - 1-Click Persona Switcher
 * ----------------------------------------------------------------------------
 * Allows teachers, evaluators, and developers to switch between test personas
 * (Librarian, Patron with active loans, Patron with overdue fine) with 1 click!
 */
router.get('/auth/demo/:persona', async (req, res) => {
  const { persona } = req.params;
  let targetEmail = 'eleanor.vance@athenaeum.edu'; // Default to Librarian

  if (persona === 'librarian') targetEmail = 'eleanor.vance@athenaeum.edu';
  else if (persona === 'alex') targetEmail = 'alex.rivera@athenaeum.edu';
  else if (persona === 'sarah') targetEmail = 'sarah.chen@athenaeum.edu';
  else if (persona === 'marcus') targetEmail = 'marcus.vance@athenaeum.edu';

  try {
    const user = await User.findOne({ email: targetEmail });
    if (user) {
      req.session.userId = user._id;
      req.session.flash = {
        type: 'info',
        message: `Switched demo persona to: ${user.name} (${user.role.toUpperCase()})`
      };
      res.redirect(user.role === 'librarian' ? '/dashboard' : '/books');
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    res.redirect('/login');
  }
});

export default router;
