/**
 * ============================================================================
 * 🌱 DATABASE SEEDER SCRIPT (`src/utils/seeder.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS "SEEDING" A DATABASE?
 * --------------------------------
 * When you first build or install an app, the database is completely empty.
 * "Seeding" means running a script that automatically fills the database with
 * realistic starter data:
 *   - 12 curated books across 6 categories (literature, computer science, etc.)
 *   - 4 user accounts (1 librarian and 3 patrons with hashed passwords)
 *   - 5 sample loan checkouts (demonstrating active, overdue, and returned books)
 *   - Audit activity logs
 * 
 * ❓ HOW DO I RUN THIS SCRIPT?
 * ----------------------------
 * In your terminal, run:
 *   npm run seed
 *   # or: node src/utils/seeder.js
 * ============================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Loan } from '../models/Loan.js';
import { Log } from '../models/Log.js';
import { Setting } from '../models/Setting.js';

// ----------------------------------------------------------------------------
// 12 CURATED SAMPLE BOOKS
// ----------------------------------------------------------------------------
const SEED_BOOKS = [
  {
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson, Gerald Jay Sussman',
    isbn: '978-0262510875',
    category: 'Computer Science',
    totalCopies: 4,
    availableCopies: 3,
    shelfLocation: 'CS-101.A',
    year: 1996,
    description: 'A legendary textbook on programming paradigms, computational models, and recursive procedures using Scheme.',
    coverStyle: 'tech-deep',
    borrowCount: 28
  },
  {
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '978-0201633610',
    category: 'Computer Science',
    totalCopies: 3,
    availableCopies: 1,
    shelfLocation: 'CS-204.C',
    year: 1994,
    description: 'Captures 23 classic software engineering design patterns providing solutions to common architectural challenges.',
    coverStyle: 'tech-deep',
    borrowCount: 35
  },
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    totalCopies: 2,
    availableCopies: 0, // Out of stock on purpose to test the Zero Available Copies rule!
    shelfLocation: 'CS-302.B',
    year: 2008,
    description: 'A definitive guide on writing maintainable, readable, and refactored code with practical case studies.',
    coverStyle: 'minimal-dark',
    borrowCount: 42
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0060935467',
    category: 'Literature',
    totalCopies: 5,
    availableCopies: 4,
    shelfLocation: 'LIT-401.D',
    year: 1960,
    description: 'The unforgettable Pulitzer Prize-winning novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
    coverStyle: 'literature-classic',
    borrowCount: 31
  },
  {
    title: 'One Hundred Years of Solitude',
    author: 'Gabriel García Márquez',
    isbn: '978-0060883287',
    category: 'Literature',
    totalCopies: 4,
    availableCopies: 3,
    shelfLocation: 'LIT-210.M',
    year: 1967,
    description: 'The brilliant masterpiece of magical realism tracing seven generations of the Buendía family in the mythical town of Macondo.',
    coverStyle: 'literature-classic',
    borrowCount: 22
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'History & Philosophy',
    totalCopies: 4,
    availableCopies: 2,
    shelfLocation: 'HIST-105.H',
    year: 2014,
    description: 'Explores how an insignificant ape became the ruler of planet Earth, spanning cognitive, agricultural, and scientific revolutions.',
    coverStyle: 'history-amber',
    borrowCount: 39
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    category: 'Science & Nature',
    totalCopies: 3,
    availableCopies: 2,
    shelfLocation: 'SCI-308.A',
    year: 1988,
    description: 'A landmark volume in science writing delving into black holes, the Big Bang, antimatter, and the nature of space and time.',
    coverStyle: 'science-cosmic',
    borrowCount: 26
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    category: 'Economics & Society',
    totalCopies: 3,
    availableCopies: 2,
    shelfLocation: 'ECON-501.K',
    year: 2011,
    description: 'Nobel laureate Daniel Kahneman explains the two systems that drive the way we think: System 1 (fast/emotional) and System 2 (slow/logical).',
    coverStyle: 'minimal-dark',
    borrowCount: 19
  },
  {
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    isbn: '978-0465050659',
    category: 'Arts & Architecture',
    totalCopies: 3,
    availableCopies: 3,
    shelfLocation: 'ART-104.N',
    year: 2013,
    description: 'An inspiring primer on cognitive ergonomics, usability, affordances, and human-centered design in product engineering.',
    coverStyle: 'tech-deep',
    borrowCount: 15
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '978-0441172719',
    category: 'Literature',
    totalCopies: 4,
    availableCopies: 3,
    shelfLocation: 'LIT-880.S',
    year: 1965,
    description: 'The science fiction epic set on the desert planet Arrakis, following young Paul Atreides amid political and ecological intrigue.',
    coverStyle: 'history-amber',
    borrowCount: 45
  },
  {
    title: 'The Republic',
    author: 'Plato',
    isbn: '978-0140455113',
    category: 'History & Philosophy',
    totalCopies: 3,
    availableCopies: 3,
    shelfLocation: 'PHIL-002.P',
    year: -375,
    description: 'The foundational philosophical inquiry into justice, morality, the philosopher-king, and the Allegory of the Cave.',
    coverStyle: 'history-amber',
    borrowCount: 14
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    isbn: '978-0345539434',
    category: 'Science & Nature',
    totalCopies: 3,
    availableCopies: 2,
    shelfLocation: 'SCI-402.S',
    year: 1980,
    description: 'Carl Sagan retells the fifteen billion years of cosmic evolution that have transformed matter into consciousness.',
    coverStyle: 'science-cosmic',
    borrowCount: 29
  }
];

/**
 * Executes the complete database population routine
 */
export async function seedDatabase() {
  if (mongoose.connection.readyState !== 1) {
    console.log('🌱 Connecting to database to seed initial data...');
    await connectDB();
  }

  // STEP 1: Wipe old collections so we start with a clean slate
  await User.deleteMany({});
  await Book.deleteMany({});
  await Loan.deleteMany({});
  await Log.deleteMany({});
  await Setting.deleteMany({});
  console.log('🧹 Cleared old collections.');

  // STEP 2: Create Default System Settings (Baseline Date & Fine Rate)
  await Setting.create({
    key: 'circulation_settings',
    simulatedDaysOffset: 0,
    fineRatePerDay: 0.75, // $0.75 fine per overdue day
    defaultLoanDays: 14,   // 14-day borrowing duration
    baseDate: new Date('2026-09-17T12:00:00Z')
  });

  // STEP 3: Create Users with Encrypted Passwords
  const eleanor = await User.create({
    name: 'Eleanor Vance',
    email: 'eleanor.vance@athenaeum.edu',
    password: 'password123',
    cardId: 'LIB-2026-001',
    role: 'librarian',
    borrowLimit: 10
  });

  const alex = await User.create({
    name: 'Alex Rivera',
    email: 'alex.rivera@athenaeum.edu',
    password: 'password123',
    cardId: 'MEM-2026-084',
    role: 'member',
    borrowLimit: 3, // 3-book limit
    totalFinesPaid: 2.25
  });

  const sarah = await User.create({
    name: 'Sarah Chen',
    email: 'sarah.chen@athenaeum.edu',
    password: 'password123',
    cardId: 'MEM-2026-112',
    role: 'member',
    borrowLimit: 3
  });

  const marcus = await User.create({
    name: 'Marcus Vance',
    email: 'marcus.vance@athenaeum.edu',
    password: 'password123',
    cardId: 'MEM-2026-305',
    role: 'member',
    borrowLimit: 3
  });

  console.log(`👤 Created 4 patrons and librarians.`);

  // STEP 4: Insert 12 Books into the Catalogue
  const books = await Book.insertMany(SEED_BOOKS);
  console.log(`📚 Inserted ${books.length} catalogue titles.`);

  // Find book references for seeding loans
  const cleanCode = books.find(b => b.isbn === '978-0132350884');
  const designPatterns = books.find(b => b.isbn === '978-0201633610');
  const sapiens = books.find(b => b.isbn === '978-0062316097');
  const dune = books.find(b => b.isbn === '978-0441172719');

  const BASE_DATE = new Date('2026-09-17T12:00:00Z');
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // STEP 5: Create Initial Circulation Loans
  // Sarah Chen: Overdue Loan on Clean Code (Due 6 days ago -> fine: 6 * 0.75 = $4.50)
  await Loan.create({
    book: cleanCode._id,
    member: sarah._id,
    issueDate: new Date(BASE_DATE.getTime() - 20 * ONE_DAY_MS),
    dueDate: new Date(BASE_DATE.getTime() - 6 * ONE_DAY_MS),
    status: 'overdue',
    fineAccrued: 4.50,
    finePaid: false
  });

  // Alex Rivera: Active Loan 1 on Clean Code (second physical copy)
  await Loan.create({
    book: cleanCode._id,
    member: alex._id,
    issueDate: new Date(BASE_DATE.getTime() - 8 * ONE_DAY_MS),
    dueDate: new Date(BASE_DATE.getTime() + 6 * ONE_DAY_MS),
    status: 'active',
    fineAccrued: 0,
    finePaid: false
  });

  // Alex Rivera: Active Loan 2 on Design Patterns
  await Loan.create({
    book: designPatterns._id,
    member: alex._id,
    issueDate: new Date(BASE_DATE.getTime() - 5 * ONE_DAY_MS),
    dueDate: new Date(BASE_DATE.getTime() + 9 * ONE_DAY_MS),
    status: 'active',
    fineAccrued: 0,
    finePaid: false
  });

  // Alex Rivera: Past returned loan on Sapiens
  await Loan.create({
    book: sapiens._id,
    member: alex._id,
    issueDate: new Date(BASE_DATE.getTime() - 35 * ONE_DAY_MS),
    dueDate: new Date(BASE_DATE.getTime() - 21 * ONE_DAY_MS),
    returnDate: new Date(BASE_DATE.getTime() - 22 * ONE_DAY_MS),
    status: 'returned',
    fineAccrued: 0,
    finePaid: false
  });

  // Sarah Chen: Past returned loan on Dune (returned 3 days late, fine already paid)
  await Loan.create({
    book: dune._id,
    member: sarah._id,
    issueDate: new Date(BASE_DATE.getTime() - 45 * ONE_DAY_MS),
    dueDate: new Date(BASE_DATE.getTime() - 31 * ONE_DAY_MS),
    returnDate: new Date(BASE_DATE.getTime() - 28 * ONE_DAY_MS),
    status: 'returned',
    fineAccrued: 2.25,
    finePaid: true
  });

  console.log(`📋 Created 5 initial circulation loan records.`);

  // STEP 6: Insert Initial Audit Trail Logs
  await Log.create([
    {
      action: 'SYSTEM_INIT',
      details: 'Athenaeum Library Database initialized with MongoDB and EJS SSR.',
      user: eleanor._id,
      timestamp: new Date(BASE_DATE.getTime() - 30 * ONE_DAY_MS)
    },
    {
      action: 'BOOK_ISSUED',
      details: 'Issued "Clean Code" to Sarah Chen (Due: Sep 11, 2026)',
      user: eleanor._id,
      timestamp: new Date(BASE_DATE.getTime() - 20 * ONE_DAY_MS)
    },
    {
      action: 'BOOK_ISSUED',
      details: 'Issued "Design Patterns" to Alex Rivera (Due: Sep 26, 2026)',
      user: eleanor._id,
      timestamp: new Date(BASE_DATE.getTime() - 5 * ONE_DAY_MS)
    }
  ]);

  console.log('✅ Seeding completed successfully!\n');
}

// Allow running directly via CLI: `node src/utils/seeder.js`
if (process.argv[1] && process.argv[1].endsWith('seeder.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
