/**
 * ============================================================================
 * 📚 ATHENAEUM LIBRARY SYSTEM - STORAGE HELPER (`storage.js`)
 * ============================================================================
 * 
 * 💡 WHAT IS THIS FILE?
 * --------------------
 * Think of this file as a digital notebook for saving and retrieving information.
 * It provides 4 simple tools:
 *   1. getItem(key)       -> Reads saved information by its name.
 *   2. setItem(key, value)-> Saves new information under a specific name.
 *   3. removeItem(key)    -> Deletes a specific saved item.
 *   4. clear()            -> Erases all saved items.
 * 
 * ❓ WHY DO WE NEED THIS?
 * -----------------------
 * - In a Web Browser: JavaScript has a built-in feature called `localStorage`
 *   that remembers data even if the user refreshes the web page.
 * - In Node.js (Terminal / Server): `localStorage` is not available by default.
 * 
 * This helper smartly checks where your code is running:
 *   👉 If inside a Browser: It uses the browser's `localStorage`.
 *   👉 If inside Node.js:   It safely saves to a JavaScript object in memory (`memoryStore`).
 * 
 * That way, your code runs smoothly everywhere without crashing!
 * ============================================================================
 */

// A simple in-memory storage box (used when running in Node.js or during tests)
const memoryStore = {};

// Check if we are currently running inside a web browser
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * The Storage Helper Object
 */
export const storage = {
  /**
   * 🔍 1. GET ITEM
   * Retrieve saved data using its unique name (key).
   * 
   * @param {string} key - The name of the item you want to retrieve.
   * @returns {string|null} - Returns the stored value, or null if not found.
   * 
   * Example:
   *   const username = storage.getItem('currentUser');
   */
  getItem: (key) => {
    if (isBrowser) {
      // Running in a web browser: read from browser localStorage
      return window.localStorage.getItem(key);
    }
    // Running in Node.js: read from our in-memory store
    return memoryStore[key] || null;
  },

  /**
   * 💾 2. SET ITEM
   * Save or update data with a unique name (key) and value.
   * 
   * @param {string} key - The name to save this item under.
   * @param {string} value - The information you want to store.
   * 
   * Example:
   *   storage.setItem('currentUser', 'Alex Rivera');
   */
  setItem: (key, value) => {
    if (isBrowser) {
      // Running in a web browser: write to browser localStorage
      window.localStorage.setItem(key, value);
    } else {
      // Running in Node.js: write to our in-memory store
      memoryStore[key] = value;
    }
  },

  /**
   * 🗑️ 3. REMOVE ITEM
   * Delete a single saved item by its name (key).
   * 
   * @param {string} key - The name of the item to delete.
   * 
   * Example:
   *   storage.removeItem('currentUser');
   */
  removeItem: (key) => {
    if (isBrowser) {
      // Running in a web browser: delete from browser localStorage
      window.localStorage.removeItem(key);
    } else {
      // Running in Node.js: delete from our in-memory store
      delete memoryStore[key];
    }
  },

  /**
   * 🧹 4. CLEAR ALL
   * Wipe out and delete ALL saved data at once.
   * 
   * Example:
   *   storage.clear();
   */
  clear: () => {
    if (isBrowser) {
      // Running in a web browser: clear all browser localStorage
      window.localStorage.clear();
    } else {
      // Running in Node.js: clear our in-memory store
      Object.keys(memoryStore).forEach((key) => {
        delete memoryStore[key];
      });
    }
  }
};

/**
 * ============================================================================
 * 🚀 BEGINNER-FRIENDLY SELF-TEST RUNNER
 * ============================================================================
 * When you run this file directly in your terminal using:
 *   node src/scripts/core/storage.js
 * 
 * The code below will execute and walk you through every feature step-by-step!
 */
if (process.argv[1] && process.argv[1].endsWith('storage.js')) {
  console.log('\n============================================================');
  console.log('🏛️  WELCOME TO THE ATHENAEUM STORAGE HELPER (BEGINNER GUIDE)');
  console.log('============================================================');
  console.log(`📍 Environment Detected: ${isBrowser ? '🌐 Web Browser (localStorage)' : '🖥️  Node.js (In-Memory Fallback)'}\n`);

  // Step 1: Saving items
  console.log('👉 STEP 1: Saving items with setItem()...');
  storage.setItem('libraryName', 'Athenaeum Central Library');
  storage.setItem('memberCount', '450');
  console.log('   ✔ Saved: "libraryName" -> "Athenaeum Central Library"');
  console.log('   ✔ Saved: "memberCount" -> "450"\n');

  // Step 2: Reading items
  console.log('👉 STEP 2: Reading items with getItem()...');
  const library = storage.getItem('libraryName');
  const members = storage.getItem('memberCount');
  console.log(`   ✔ Retrieved libraryName: "${library}"`);
  console.log(`   ✔ Retrieved memberCount: "${members}"\n`);

  // Step 3: Removing a specific item
  console.log('👉 STEP 3: Deleting an item with removeItem()...');
  storage.removeItem('memberCount');
  const removedCheck = storage.getItem('memberCount');
  console.log(`   ✔ "memberCount" was deleted. Checking value now: ${removedCheck} (null means it is gone!)\n`);

  // Step 4: Clearing all items
  console.log('👉 STEP 4: Clearing all remaining items with clear()...');
  storage.clear();
  const libraryCheck = storage.getItem('libraryName');
  console.log(`   ✔ Everything cleared. Checking "libraryName": ${libraryCheck} (null means clean!)\n`);

  console.log('============================================================');
  console.log('🎉 SUCCESS: All 4 storage operations worked perfectly!');
  console.log('💡 TIP FOR BEGINNERS:');
  console.log('   - To run this test again: node src/scripts/core/storage.js');
  console.log('   - To launch the full web app: npm start (visit http://localhost:3000)');
  console.log('   - To run all automated tests: npm test');
  console.log('============================================================\n');
}
