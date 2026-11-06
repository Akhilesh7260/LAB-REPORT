-- Create the books table (title is UNIQUE to prevent duplicate seed records)
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    author TEXT NOT NULL,
    price REAL NOT NULL,
    pages INTEGER
);

-- Add unique index on title for existing databases that lack the constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_title ON books(title);
