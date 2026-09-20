# 🏛️ Athenaeum - Modern Library Management & Circulation System

> A full-stack role-based Library Management & Circulation Web Application built with **Server-Side Rendering (SSR)** using **EJS**, **Node.js**, **Express.js**, **MongoDB Atlas (via Mongoose)**, and **Session-based Authentication**.

🌐 **Live Deployed Site (Free $0 Tier on Render)**: **[https://web2-3-g3bg.onrender.com](https://web2-3-g3bg.onrender.com)**

---

## 💡 Beginner's Introduction: How This App Works

If you are new to web development, here is how the pieces fit together:

```
+------------------+         +------------------+         +------------------+
|   Web Browser    |  ---->  | Express Backend  |  ---->  | MongoDB Database |
| (User sees HTML) |  <----  | (Node.js + EJS)  |  <----  |  (Stores data)   |
+------------------+         +------------------+         +------------------+
```

1. **Browser**: The user clicks a button (like "Borrow Book" or "Add Book").
2. **Express Server**: Receives the request in `src/routes/`, checks if the user is logged in, and applies business rules (e.g. checking if copies are available).
3. **MongoDB**: The server reads or saves data using Mongoose models (`Book`, `User`, `Loan`).
4. **EJS Template**: Express takes the data and merges it into an HTML template (`src/views/`) to send back a complete web page to the user's browser.

---

## 🛠️ Technology Stack

| Layer | Technology | Beginner Explanation |
|---|---|---|
| **Backend Framework** | Node.js + Express.js | Runs the server and handles web requests |
| **Frontend / Templates** | EJS (Embedded JavaScript) | Generates dynamic HTML pages on the server |
| **Styling** | Vanilla CSS | Modern CSS design with light/dark modes (no external frameworks needed) |
| **Database** | MongoDB Atlas / Local MongoDB | Stores books, patron records, loans, and audit logs |
| **Database Helper** | Mongoose ORM | Translates JavaScript code into MongoDB database operations |
| **Authentication** | express-session + connect-mongo | Remembers who is logged in across page visits |
| **Security** | bcryptjs | Securely scrambles and encrypts user passwords |

---

## 📁 Beginner-Friendly Folder Structure

```
├── server.js                   # 🚀 Main entry point - starts database & server
├── package.json                # 📦 Lists all dependencies and start scripts
├── tests/
│   └── circulation.test.js     # 🧪 Automated test suite (21 assertions)
├── public/                     # 🌐 Static files served directly to browser
│   ├── css/styles.css          # Beautiful light/dark theme styles
│   ├── js/client.js            # Browser JavaScript (theme toggle, modals)
│   └── favicon.svg             # Website icon
├── src/
│   ├── app.js                  # ⚙️ Configures Express plugins and routes
│   ├── config/
│   │   └── db.js               # 🍃 Connects to MongoDB database
│   ├── models/                 # 📋 Database blueprints (Schemas)
│   │   ├── User.js             # Patrons and Librarians with encrypted passwords
│   │   ├── Book.js             # Catalogue titles, categories, copy inventory
│   │   ├── Loan.js             # Active checkouts, due dates, fines
│   │   ├── Log.js              # Audit trail of library actions
│   │   └── Setting.js          # Global rules and Time Machine simulation clock
│   ├── middlewares/            # 🛡️ Security guards for routes
│   │   ├── auth.js             # Checks login status and role permissions
│   │   └── simulation.js       # Injects current simulated date into templates
│   ├── routes/                 # 🚦 Controllers handling web pages & actions
│   │   ├── auth.routes.js      # Login, registration, 1-click persona switch
│   │   ├── book.routes.js      # Search, filter, add/edit/delete books
│   │   ├── circulation.routes.js # Borrowing, returning, fines, and time-travel
│   │   ├── dashboard.routes.js # KPIs, metrics, most-borrowed books chart
│   │   └── member.routes.js    # Patron directory and personal borrower portal
│   ├── utils/                  # 🧰 Helper utilities
│   │   ├── fineCalculator.js   # Overdue days and $0.75/day fine arithmetic
│   │   └── seeder.js           # Seeds 12 books, 4 users, and initial loans
│   └── views/                  # 📄 EJS HTML web templates
│       ├── layouts/            # Reusable header.ejs and footer.ejs
│       ├── books/              # Catalogue list, detail, and form views
│       ├── circulation/        # Circulation desk and "My Loans" portal
│       ├── dashboard/          # Analytics and KPI charts
│       ├── members/            # Patron directory and dossiers
│       └── auth/               # Login and register pages
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Create or edit your `.env` file:
```env
# For local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/athenaeum_db

# Or for MongoDB Atlas Cloud:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/athenaeum?retryWrites=true&w=majority
```

### 3. Seed Initial Sample Data
Populate the database with 12 books, 4 test personas, and sample loans:
```bash
npm run seed
```

### 4. Start the Application
```bash
npm start
```
Now open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

## 👥 Demo Logins & Testing Personas

On the Login screen (`/login`), you can click any of the **1-Click Demo Persona buttons** for instant evaluation:

| Persona | Role | Testing Scenario |
|---|---|---|
| **Eleanor Vance** | `Librarian` | Full administrative control: Add/Edit books, issue books directly, waive fines. |
| **Alex Rivera** | `Member` | Patron who already has 2 active books checked out (test borrowing up to his 3-book limit). |
| **Sarah Chen** | `Member` | Patron who has an overdue copy of *Clean Code* (test fine settlement and warnings). |
| **Marcus Vance** | `Member` | Clean slate patron with 0 current loans. |

---

## 🛡️ Key Library Guardrails Built Into This System

1. **Zero Available Copies Guard**:
   - If `availableCopies === 0` (e.g. *Clean Code*), borrowing is blocked.
2. **Per-Member Quota Guard**:
   - Members cannot borrow more than their allowed quota (default: 3 books).
3. **Duplicate Checkout Prevention**:
   - A member cannot borrow a second copy of a book they already have checked out.
4. **Automatic Copy Replenishment**:
   - When a book is returned, `availableCopies` increments automatically.
5. **Overdue Fine Engine & Time Travel**:
   - Fines accumulate dynamically at **$0.75 per day overdue**.
   - Use the **Time Machine** buttons (`+3 Days`, `+7 Days`, `+15 Days`) in the header to simulate overdue books in real time!

---

## 🧪 Running Automated Tests

Run the complete test suite to verify all guardrails and fine calculations:
```bash
npm test
```
All 21 assertions will execute and report passing status.
