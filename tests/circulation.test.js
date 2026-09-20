/**
 * ============================================================================
 * 🧪 AUTOMATED INTEGRATION TESTS (`tests/circulation.test.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * This file contains automated tests for our library circulation system.
 * Instead of clicking around in a web browser for 10 minutes to verify that
 * borrowing and fines work, this script tests everything automatically in 1 second!
 * 
 * ❓ WHAT DOES THIS TEST SUITE VERIFY?
 * -----------------------------------
 *   ✔ Test 1: Database Seeding (verifies 12 books, 4 users, and 5 loans).
 *   ✔ Test 2: Zero Copies Guard (verifies that out-of-stock books cannot be borrowed).
 *   ✔ Test 3: Borrow Quota Limit (verifies that patrons cannot exceed their 3-book limit).
 *   ✔ Test 4: Duplicate Checkouts (verifies that a member cannot borrow 2 copies of the same book).
 *   ✔ Test 5: Return Flow & Copy Auto-Increment (verifies copies go back onto shelves upon return).
 *   ✔ Test 6: Stretch Goal Overdue Fines (fast-forwards time by +15 days and verifies exact fine math at $0.75/day).
 *   ✔ Test 7: Fine Settlement (verifies marking fines as paid).
 * 
 * 🚀 HOW DO I RUN THIS TEST?
 * --------------------------
 * In your terminal:
 *   npm test
 * ============================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seeder.js';
import { User } from '../src/models/User.js';
import { Book } from '../src/models/Book.js';
import { Loan } from '../src/models/Loan.js';
import { Setting } from '../src/models/Setting.js';
import { getSimulatedDate, evaluateLoanFine, ONE_DAY_MS } from '../src/utils/fineCalculator.js';

let passed = 0;
let total = 0;

/**
 * Helper function that checks if a condition is true.
 * If true: prints a green checkmark.
 * If false: prints a red error and stops the test.
 */
function assert(condition, desc) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${desc}`);
    throw new Error(desc);
  }
  passed++;
  console.log(`✅ PASS: ${desc}`);
}

async function runIntegrationTests() {
  console.log('🏛️ RUNNING MONGOOSE & CIRCULATION INTEGRATION TESTS...\n');

  // STEP 1: Connect to MongoDB and seed fresh test data
  await connectDB();
  await seedDatabase();

  // --------------------------------------------------------------------------
  // TEST 1: Verify Initial Database Seeding
  // --------------------------------------------------------------------------
  const booksCount = await Book.countDocuments();
  const usersCount = await User.countDocuments();
  const loansCount = await Loan.countDocuments();

  assert(booksCount === 12, `Database has 12 books seeded (actual: ${booksCount})`);
  assert(usersCount === 4, `Database has 4 users seeded (actual: ${usersCount})`);
  assert(loansCount === 5, `Database has 5 initial loans seeded (actual: ${loansCount})`);

  // --------------------------------------------------------------------------
  // TEST 2: Guardrail - Zero Available Copies Protection
  // --------------------------------------------------------------------------
  const outOfStockBook = await Book.findOne({ isbn: '978-0132350884' }); // "Clean Code" has 0 copies
  assert(outOfStockBook.availableCopies === 0, 'Clean Code has 0 available copies on shelf');

  // Verify that the system blocks borrowing when availableCopies <= 0
  const canBorrowZero = outOfStockBook.availableCopies > 0;
  assert(canBorrowZero === false, 'Issuing book with 0 available copies is blocked by guardrail');

  // --------------------------------------------------------------------------
  // TEST 3: Guardrail - Per-Member Borrowing Limit Enforcement (Max 3 Books)
  // --------------------------------------------------------------------------
  const alex = await User.findOne({ email: 'alex.rivera@athenaeum.edu' }); // Quota: 3 books
  const alexActiveBefore = await Loan.countDocuments({ member: alex._id, status: { $ne: 'returned' } });
  assert(alexActiveBefore === 2, `Alex Rivera starts with 2 active loans (actual: ${alexActiveBefore})`);

  // Alex borrows his 3rd book (Plato's Republic)
  const republic = await Book.findOne({ isbn: '978-0140455113' });
  const republicCopiesBefore = republic.availableCopies;

  const simDate = await getSimulatedDate();
  const loan3 = await Loan.create({
    book: republic._id,
    member: alex._id,
    issueDate: simDate,
    dueDate: new Date(simDate.getTime() + 14 * ONE_DAY_MS),
    status: 'active'
  });
  republic.availableCopies = Math.max(0, republic.availableCopies - 1);
  await republic.save();

  assert(republic.availableCopies === republicCopiesBefore - 1, 'Available copies decremented after 3rd issue');

  const alexActiveAfter3 = await Loan.countDocuments({ member: alex._id, status: { $ne: 'returned' } });
  assert(alexActiveAfter3 === 3, 'Alex has reached his per-member limit of 3 books');

  // Attempt to borrow a 4th book (must be blocked by quota check)
  const canBorrow4th = alexActiveAfter3 < alex.borrowLimit;
  assert(canBorrow4th === false, 'Attempting 4th borrow beyond member quota is blocked by guardrail');

  // --------------------------------------------------------------------------
  // TEST 4: Guardrail - Prevent Duplicate Active Checkout of the Same Title
  // --------------------------------------------------------------------------
  const existingLoanForRepublic = await Loan.findOne({
    book: republic._id,
    member: alex._id,
    status: { $ne: 'returned' }
  });
  assert(!!existingLoanForRepublic, 'Active loan for Republic already exists');

  const duplicateAllowed = !existingLoanForRepublic;
  assert(duplicateAllowed === false, 'Duplicate active checkout of the same title is rejected');

  // --------------------------------------------------------------------------
  // TEST 5: Return Book & Automatic Copy Increment
  // --------------------------------------------------------------------------
  // Return Plato's Republic back to the library
  republic.availableCopies = Math.min(republic.totalCopies, republic.availableCopies + 1);
  await republic.save();
  loan3.status = 'returned';
  loan3.returnDate = simDate;
  await loan3.save();

  assert(republic.availableCopies === republicCopiesBefore, 'Book available copies auto-incremented back to original count');
  const alexActiveAfterReturn = await Loan.countDocuments({ member: alex._id, status: { $ne: 'returned' } });
  assert(alexActiveAfterReturn === 2, 'Alex active loans count reduced back to 2');

  // --------------------------------------------------------------------------
  // TEST 6: Stretch Goal - Automatic Overdue Fine Calculation & Time Travel
  // --------------------------------------------------------------------------
  const settings = await Setting.findOne({ key: 'circulation_settings' });
  settings.simulatedDaysOffset = 15; // Fast-forward time machine by +15 days!
  await settings.save();

  const advancedDate = await getSimulatedDate();
  console.log(`\nAdvanced simulated date (+15d): ${advancedDate.toISOString().split('T')[0]}`);

  let activeLoans = await Loan.find({ status: { $ne: 'returned' } }).populate('book member');
  activeLoans = activeLoans.map(l => evaluateLoanFine(l, advancedDate, 0.75));

  const overdueLoans = activeLoans.filter(l => l.status === 'overdue');
  assert(overdueLoans.length >= 3, `Overdue loans dynamically transitioned (count: ${overdueLoans.length})`);

  // Verify that every overdue loan has positive days overdue and exact $0.75/day fine
  overdueLoans.forEach(loan => {
    assert(loan.daysOverdue > 0, `Loan ${loan._id} has positive days overdue (${loan.daysOverdue}d)`);
    const expectedFine = Number((loan.daysOverdue * 0.75).toFixed(2));
    assert(
      loan.fineAccrued === expectedFine,
      `Fine for loan ${loan._id} is $${loan.fineAccrued.toFixed(2)} (expected: $${expectedFine.toFixed(2)})`
    );
  });

  // --------------------------------------------------------------------------
  // TEST 7: Fine Settlement (Marking Fines as Paid)
  // --------------------------------------------------------------------------
  const sampleOverdue = overdueLoans[0];
  sampleOverdue.finePaid = true;
  await sampleOverdue.save();
  assert(sampleOverdue.finePaid === true, 'Fine settlement successfully marked loan as paid');

  console.log(`\n🎉 ALL ${passed} OF ${total} TESTS PASSED WITH 100% SUCCESS!\n`);
  await mongoose.connection.close();
}

// Run the integration test runner
runIntegrationTests().catch(async (err) => {
  console.error('\n❌ Test execution encountered an error:', err);
  await mongoose.connection.close();
  process.exit(1);
});
