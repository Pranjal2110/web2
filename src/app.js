/**
 * ============================================================================
 * 🌐 EXPRESS APPLICATION CONFIGURATION (`src/app.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * Think of this file as the "control center" of our web application.
 * It configures Express (our web server framework) with all its plugins (called "middleware"),
 * connects the EJS HTML templating system, and directs web traffic to the right routes.
 * 
 * ❓ KEY CONCEPTS FOR BEGINNERS:
 * -----------------------------
 * 1. Express App: The software engine that receives HTTP requests from web browsers and returns HTML or data.
 * 2. Middleware: Functions that run in the middle of a request (like checking if someone is logged in before showing a page).
 * 3. EJS (Embedded JavaScript): Allows us to write HTML pages that dynamically show data from MongoDB (like a list of books).
 * 4. Sessions: Keeps users logged in across different page visits using a secure browser cookie.
 * ============================================================================
 */

import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Custom Middlewares
import { loadUserSession } from './middlewares/auth.js';
import { loadSimulationClock } from './middlewares/simulation.js';

// Route Handlers (Controllers)
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import bookRoutes from './routes/book.routes.js';
import circulationRoutes from './routes/circulation.routes.js';
import memberRoutes from './routes/member.routes.js';

// Calculate directory paths so Node can find templates and static files reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Create the main Express application instance
const app = express();

// ----------------------------------------------------------------------------
// 1. VIEW ENGINE SETUP (EJS)
// ----------------------------------------------------------------------------
// Tell Express to use EJS for rendering HTML pages
app.set('view engine', 'ejs');
// Tell Express where our HTML/EJS templates live: inside the `src/views` folder
app.set('views', path.join(__dirname, 'views'));

// ----------------------------------------------------------------------------
// 2. STATIC ASSETS
// ----------------------------------------------------------------------------
// Files in `public/` (like styles.css, client.js, icons) will be served directly to the browser
app.use(express.static(path.join(rootDir, 'public')));

// ----------------------------------------------------------------------------
// 3. BODY PARSERS
// ----------------------------------------------------------------------------
// Allows Express to understand data submitted through HTML forms (<form method="POST">)
app.use(express.urlencoded({ extended: true }));
// Allows Express to understand JSON data sent in API requests
app.use(express.json());
// HTML forms only support GET and POST. This plugin lets us use DELETE or PUT via `?_method=DELETE`
app.use(methodOverride('_method'));

// ----------------------------------------------------------------------------
// 4. USER SESSION MANAGEMENT (express-session + connect-mongo)
// ----------------------------------------------------------------------------
// Stores user login sessions in MongoDB so users stay logged in even if the server restarts
const sessionClientPromise = new Promise((resolve) => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.getClient()) {
    return resolve(mongoose.connection.getClient());
  }
  mongoose.connection.once('open', () => {
    resolve(mongoose.connection.getClient());
  });
});

app.use(session({
  // Secret string used to sign the session ID cookie (keep this safe in production!)
  secret: process.env.SESSION_SECRET || 'athenaeum_modern_library_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    clientPromise: sessionClientPromise,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // Remember login sessions for 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    httpOnly: true, // Prevents malicious client-side JavaScript from reading the cookie
    sameSite: 'lax'
  }
}));

// ----------------------------------------------------------------------------
// 5. CUSTOM GLOBAL MIDDLEWARES
// ----------------------------------------------------------------------------
// Check if the current visitor is logged in and make their profile available in all EJS templates
app.use(loadUserSession);
// Inject the library's simulated clock into all EJS views (for time-travel fine calculations)
app.use(loadSimulationClock);

// ----------------------------------------------------------------------------
// 6. APPLICATION ROUTES
// ----------------------------------------------------------------------------
// Direct visitors to the appropriate router based on the URL they visit
app.use('/', authRoutes);             // /login, /register, /logout
app.use('/', dashboardRoutes);        // / and /dashboard (KPIs and metrics)
app.use('/books', bookRoutes);        // /books, /books/new, /books/:id (catalogue)
app.use('/circulation', circulationRoutes); // /circulation (checkout and return desk)
app.use('/', circulationRoutes);      // /simulation/advance (time machine)
app.use('/', memberRoutes);           // /members, /members/:id, /my-loans

// ----------------------------------------------------------------------------
// 7. 404 CATCH-ALL HANDLER
// ----------------------------------------------------------------------------
// If a user visits an address that does not match any route above, render our friendly 404 page
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Page Not Found | Athenaeum',
    message: 'The requested library resource or page does not exist.'
  });
});

export default app;
