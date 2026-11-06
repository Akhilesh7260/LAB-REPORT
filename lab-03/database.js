const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "books.db");
const SQL_PATH = path.join(__dirname, "initDB.sql");

let db;

/**
 * Opens the SQLite database connection.
 * Returns a Promise that resolves with the database instance.
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("❌ Failed to connect to SQLite database:", err.message);
        reject(err);
      } else {
        console.log("✅ Connected to SQLite database at", DB_PATH);
        resolve(db);
      }
    });
  });
}

/**
 * Sample books to seed into the database.
 * Uses INSERT OR IGNORE with a UNIQUE title constraint to prevent duplicates on restart.
 */
const SEED_BOOKS = [
  // 3 required books
  { title: "The Alchemist", author: "Paulo Coelho", price: 299.0, pages: 208 },
  { title: "Wings of Fire", author: "A. P. J. Abdul Kalam", price: 250.0, pages: 180 },
  { title: "Atomic Habits", author: "James Clear", price: 350.0, pages: 320 },
  // 7 additional sample books
  { title: "Sapiens", author: "Yuval Noah Harari", price: 499.0, pages: 498 },
  { title: "The Lean Startup", author: "Eric Ries", price: 399.0, pages: 336 },
  { title: "Deep Work", author: "Cal Newport", price: 325.0, pages: 304 },
  { title: "Ikigai", author: "Hector Garcia", price: 275.0, pages: 208 },
  { title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", price: 350.0, pages: 336 },
  { title: "The Psychology of Money", author: "Morgan Housel", price: 299.0, pages: 256 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", price: 450.0, pages: 499 },
];

/**
 * Initializes the database by running the initDB.sql script and seeding sample books.
 * Prevents duplicate seed data using INSERT OR IGNORE with a UNIQUE title constraint.
 * Existing books are never deleted or overwritten.
 */
async function initializeDatabase() {
  try {
    await openDatabase();

    // Enable WAL mode for better concurrency
    await runQuery("PRAGMA journal_mode=WAL");

    // Read and execute the SQL initialization script (table creation)
    const sql = fs.readFileSync(SQL_PATH, "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .filter((s) => !s.split("\n").every((line) => line.trim().startsWith("--") || line.trim() === ""));

    for (const statement of statements) {
      await runQuery(statement);
    }

    // Seed sample books using parameterized queries (INSERT OR IGNORE prevents duplicates)
    const insertSQL =
      "INSERT OR IGNORE INTO books (title, author, price, pages) VALUES (?, ?, ?, ?)";
    for (const book of SEED_BOOKS) {
      await runQuery(insertSQL, [book.title, book.author, book.price, book.pages]);
    }

    // Verify initialization
    const count = await getQuery("SELECT COUNT(*) AS count FROM books");
    console.log(`✅ Database initialized. Total books: ${count.count}`);

    return db;
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
    throw err;
  }
}

/**
 * Runs a SQL query that does not return rows (INSERT, UPDATE, DELETE, CREATE).
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Runs a SQL query that returns a single row.
 */
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Runs a SQL query that returns multiple rows.
 */
function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Closes the database connection gracefully.
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error("❌ Error closing database:", err.message);
          reject(err);
        } else {
          console.log("✅ Database connection closed.");
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  runQuery,
  getQuery,
  allQuery,
  closeDatabase,
};

