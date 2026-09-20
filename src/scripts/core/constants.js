/**
 * constants.js - Static Configuration, Theme Palettes & Seed Collections
 */

export const STORAGE_KEYS = {
  BOOKS: 'athenaeum_books_v1',
  MEMBERS: 'athenaeum_members_v1',
  LOANS: 'athenaeum_loans_v1',
  SETTINGS: 'athenaeum_settings_v1',
  AUDIT_LOGS: 'athenaeum_logs_v1',
  ACTIVE_USER_ID: 'athenaeum_active_user_v1',
  THEME: 'athenaeum_theme_v1'
};

export const DEFAULT_SETTINGS = {
  fineRatePerDay: 0.75, // $0.75 / day overdue
  defaultLoanDays: 14,
  maxBorrowLimitPerMember: 3,
  simulatedDaysOffset: 0,
  baseDate: '2026-09-17'
};

export const COVER_GRADIENTS = {
  'tech-deep': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)',
  'literature-classic': 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
  'science-cosmic': 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #9333ea 100%)',
  'history-amber': 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)',
  'minimal-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
};

export const CATEGORY_COLORS = {
  'Computer Science': '#6366f1',
  'Literature': '#10b981',
  'Science & Nature': '#8b5cf6',
  'History & Philosophy': '#f59e0b',
  'Arts & Architecture': '#ec4899',
  'Economics & Society': '#0ea5e9'
};

export const SEED_BOOKS = [
  {
    id: 'b1',
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
    id: 'b2',
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
    id: 'b3',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    totalCopies: 2,
    availableCopies: 0, // Zero copies available to test guardrail!
    shelfLocation: 'CS-302.B',
    year: 2008,
    description: 'A definitive guide on writing maintainable, readable, and refactored code with practical case studies.',
    coverStyle: 'minimal-dark',
    borrowCount: 42
  },
  {
    id: 'b4',
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
    id: 'b5',
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
    id: 'b6',
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
    id: 'b7',
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
    id: 'b8',
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
    id: 'b9',
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
    id: 'b10',
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
    id: 'b11',
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
    id: 'b12',
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

export const SEED_MEMBERS = [
  {
    id: 'u1',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@athenaeum.edu',
    cardId: 'LIB-2026-001',
    role: 'librarian',
    borrowLimit: 10,
    activeLoansCount: 0,
    totalFinesPaid: 0,
    status: 'active',
    joinedDate: '2023-01-15'
  },
  {
    id: 'u2',
    name: 'Alex Rivera',
    email: 'alex.rivera@athenaeum.edu',
    cardId: 'MEM-2026-084',
    role: 'member',
    borrowLimit: 3,
    activeLoansCount: 2, // Has 2 active loans, limit is 3
    totalFinesPaid: 2.25,
    status: 'active',
    joinedDate: '2024-03-10'
  },
  {
    id: 'u3',
    name: 'Sarah Chen',
    email: 'sarah.chen@athenaeum.edu',
    cardId: 'MEM-2026-112',
    role: 'member',
    borrowLimit: 3,
    activeLoansCount: 1, // Has an overdue loan with fine!
    totalFinesPaid: 0.00,
    status: 'active',
    joinedDate: '2024-05-22'
  },
  {
    id: 'u4',
    name: 'Marcus Vance',
    email: 'marcus.vance@athenaeum.edu',
    cardId: 'MEM-2026-305',
    role: 'member',
    borrowLimit: 3,
    activeLoansCount: 0, // Clean slate patron
    totalFinesPaid: 0,
    status: 'active',
    joinedDate: '2025-08-01'
  }
];

const TODAY_MS = new Date('2026-09-17T12:00:00Z').getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const SEED_LOANS = [
  {
    id: 'ln-101',
    bookId: 'b3', // Clean Code
    memberId: 'u3', // Sarah Chen
    issueDate: new Date(TODAY_MS - 20 * ONE_DAY_MS).toISOString().split('T')[0],
    dueDate: new Date(TODAY_MS - 6 * ONE_DAY_MS).toISOString().split('T')[0],
    returnDate: null,
    status: 'overdue',
    fineAccrued: 4.50, // 6 days overdue * $0.75
    finePaid: false
  },
  {
    id: 'ln-102',
    bookId: 'b3', // Clean Code (second copy)
    memberId: 'u2', // Alex Rivera
    issueDate: new Date(TODAY_MS - 8 * ONE_DAY_MS).toISOString().split('T')[0],
    dueDate: new Date(TODAY_MS + 6 * ONE_DAY_MS).toISOString().split('T')[0],
    returnDate: null,
    status: 'active',
    fineAccrued: 0,
    finePaid: false
  },
  {
    id: 'ln-103',
    bookId: 'b2', // Design Patterns
    memberId: 'u2', // Alex Rivera
    issueDate: new Date(TODAY_MS - 5 * ONE_DAY_MS).toISOString().split('T')[0],
    dueDate: new Date(TODAY_MS + 9 * ONE_DAY_MS).toISOString().split('T')[0],
    returnDate: null,
    status: 'active',
    fineAccrued: 0,
    finePaid: false
  },
  {
    id: 'ln-104',
    bookId: 'b6', // Sapiens
    memberId: 'u2', // Alex Rivera
    issueDate: new Date(TODAY_MS - 35 * ONE_DAY_MS).toISOString().split('T')[0],
    dueDate: new Date(TODAY_MS - 21 * ONE_DAY_MS).toISOString().split('T')[0],
    returnDate: new Date(TODAY_MS - 22 * ONE_DAY_MS).toISOString().split('T')[0],
    status: 'returned',
    fineAccrued: 0,
    finePaid: false
  },
  {
    id: 'ln-105',
    bookId: 'b10', // Dune
    memberId: 'u3', // Sarah Chen
    issueDate: new Date(TODAY_MS - 45 * ONE_DAY_MS).toISOString().split('T')[0],
    dueDate: new Date(TODAY_MS - 31 * ONE_DAY_MS).toISOString().split('T')[0],
    returnDate: new Date(TODAY_MS - 28 * ONE_DAY_MS).toISOString().split('T')[0],
    status: 'returned',
    fineAccrued: 2.25,
    finePaid: true
  }
];

export const SEED_LOGS = [
  {
    id: 'log-1',
    action: 'SYSTEM_INIT',
    details: 'Athenaeum Library Database initialized with 12 titles and 4 patron records.',
    timestamp: new Date(TODAY_MS - 30 * ONE_DAY_MS).toISOString()
  },
  {
    id: 'log-2',
    action: 'BOOK_ISSUED',
    details: 'Issued "Clean Code" to Sarah Chen (Due: Sep 11, 2026)',
    timestamp: new Date(TODAY_MS - 20 * ONE_DAY_MS).toISOString()
  },
  {
    id: 'log-3',
    action: 'BOOK_ISSUED',
    details: 'Issued "Design Patterns" to Alex Rivera (Due: Sep 26, 2026)',
    timestamp: new Date(TODAY_MS - 5 * ONE_DAY_MS).toISOString()
  }
];
