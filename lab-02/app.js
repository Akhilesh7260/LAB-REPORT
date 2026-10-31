const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
const PORT = process.env.PORT || 3000;
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const isValidBook = ({ title, author, price, pages }) =>
  typeof title === "string" && title.trim() !== "" &&
  typeof author === "string" && author.trim() !== "" &&
  Number.isInteger(price) && price >= 0 &&
  Number.isInteger(pages) && pages > 0;

const isValidId = (id) => /^\d+$/.test(id);

// GET all books
app.get("/books/", async (request, response) => {
  try {
    const books = await db.all("SELECT * FROM book ORDER BY id;");
    response.status(200).send(books);
  } catch (e) {
    response.status(500).send({ error: "Internal server error" });
  }
});

// GET one book
app.get("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  if (!isValidId(bookId)) return response.status(400).send({ error: "Invalid book id" });
  try {
    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) return response.status(404).send({ error: "Book not found" });
    response.status(200).send(book);
  } catch (e) {
    response.status(500).send({ error: "Internal server error" });
  }
});

// POST add book
app.post("/books/", async (request, response) => {
  if (!isValidBook(request.body || {})) {
    return response.status(400).send({ error: "title, author (text) and price, pages (integers) are required" });
  }
  const { title, author, price, pages } = request.body;
  try {
    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
      [title, author, price, pages]
    );
    response.status(201).send({ message: "Book added successfully", bookId: result.lastID });
  } catch (e) {
    response.status(500).send({ error: "Internal server error" });
  }
});

// PUT update book
app.put("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  if (!isValidId(bookId)) return response.status(400).send({ error: "Invalid book id" });
  if (!isValidBook(request.body || {})) {
    return response.status(400).send({ error: "title, author (text) and price, pages (integers) are required" });
  }
  const { title, author, price, pages } = request.body;
  try {
    const result = await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
      [title, author, price, pages, bookId]
    );
    if (result.changes === 0) return response.status(404).send({ error: "Book not found" });
    response.status(200).send({ message: "Book updated successfully" });
  } catch (e) {
    response.status(500).send({ error: "Internal server error" });
  }
});

// DELETE book
app.delete("/books/:bookId/", async (request, response) => {
  const { bookId } = request.params;
  if (!isValidId(bookId)) return response.status(400).send({ error: "Invalid book id" });
  try {
    const result = await db.run("DELETE FROM book WHERE id = ?;", [bookId]);
    if (result.changes === 0) return response.status(404).send({ error: "Book not found" });
    response.status(200).send({ message: "Book deleted successfully" });
  } catch (e) {
    response.status(500).send({ error: "Internal server error" });
  }
});

module.exports = app;
