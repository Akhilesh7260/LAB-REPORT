const express = require("express");
const { initializeDatabase, runQuery, getQuery, allQuery, closeDatabase } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Parse JSON request bodies
app.use(express.json());

// Handle malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON in request body.",
    });
  }
  next(err);
});

// ─── Validation Helpers ──────────────────────────────────────────────────────

const VALID_ORDER_COLUMNS = ["id", "title", "author", "price", "pages"];
const VALID_ORDER_DIRECTIONS = ["ASC", "DESC"];

/**
 * Validates the book data from request body.
 * Returns an error message string or null if valid.
 */
function validateBookData(body, isUpdate = false) {
  const { title, author, price, pages } = body;

  if (!isUpdate || title !== undefined) {
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return "Book title is required and must be a non-empty string.";
    }
  }

  if (!isUpdate || author !== undefined) {
    if (!author || typeof author !== "string" || author.trim().length === 0) {
      return "Author is required and must be a non-empty string.";
    }
  }

  if (!isUpdate || price !== undefined) {
    if (price === undefined || price === null || price === "") {
      return "Price is required.";
    }
    if (typeof price !== "number" || isNaN(price)) {
      return "Price must be a valid number.";
    }
    if (price < 0) {
      return "Price must not be negative.";
    }
  }

  if (pages !== undefined && pages !== null) {
    if (typeof pages !== "number" || !Number.isInteger(pages)) {
      return "Pages must be a valid integer.";
    }
    if (pages < 0) {
      return "Pages must not be negative.";
    }
  }

  return null;
}

/**
 * Validates that an ID parameter is a positive integer.
 */
function validateId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    return false;
  }
  return parsed;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET / – API Welcome
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Books REST API!",
    version: "1.0.0",
    endpoints: {
      "GET /": "API welcome information",
      "GET /books": "Get all books (supports search, sort, filter, pagination)",
      "GET /books/:id": "Get a book by ID",
      "POST /books": "Add a new book",
      "PUT /books/:id": "Update an existing book",
      "DELETE /books/:id": "Delete a book",
    },
  });
});

// GET /books – Get all books with query parameters
app.get("/books", async (req, res) => {
  try {
    const { search_q, order_by, order, min_price, max_price, limit, offset } = req.query;

    let sql = "SELECT * FROM books";
    const params = [];
    const conditions = [];

    // ── Search by title (partial match) ──
    if (search_q !== undefined) {
      conditions.push("title LIKE ?");
      params.push(`%${search_q}%`);
    }

    // ── Price range filtering ──
    if (min_price !== undefined) {
      const minP = parseFloat(min_price);
      if (isNaN(minP) || minP < 0) {
        return res.status(400).json({
          error: "Invalid min_price. Must be a non-negative number.",
        });
      }
      conditions.push("price >= ?");
      params.push(minP);
    }

    if (max_price !== undefined) {
      const maxP = parseFloat(max_price);
      if (isNaN(maxP) || maxP < 0) {
        return res.status(400).json({
          error: "Invalid max_price. Must be a non-negative number.",
        });
      }
      conditions.push("price <= ?");
      params.push(maxP);
    }

    if (min_price !== undefined && max_price !== undefined) {
      const minP = parseFloat(min_price);
      const maxP = parseFloat(max_price);
      if (minP > maxP) {
        return res.status(400).json({
          error: "Invalid price range. min_price must be less than or equal to max_price.",
        });
      }
    }

    // ── Apply WHERE conditions ──
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    // ── Sorting ──
    if (order_by !== undefined) {
      if (!VALID_ORDER_COLUMNS.includes(order_by)) {
        return res.status(400).json({
          error: `Invalid order_by column '${order_by}'. Allowed columns: ${VALID_ORDER_COLUMNS.join(", ")}.`,
        });
      }

      const direction = order ? order.toUpperCase() : "ASC";
      if (!VALID_ORDER_DIRECTIONS.includes(direction)) {
        return res.status(400).json({
          error: `Invalid order direction '${order}'. Allowed values: ASC, DESC.`,
        });
      }

      sql += ` ORDER BY ${order_by} ${direction}`;
    }

    // ── Pagination ──
    if (limit !== undefined) {
      const lim = parseInt(limit, 10);
      if (isNaN(lim) || lim < 0 || String(lim) !== String(limit)) {
        return res.status(400).json({
          error: "Invalid limit. Must be a non-negative integer.",
        });
      }
      sql += " LIMIT ?";
      params.push(lim);
    }

    if (offset !== undefined) {
      const off = parseInt(offset, 10);
      if (isNaN(off) || off < 0 || String(off) !== String(offset)) {
        return res.status(400).json({
          error: "Invalid offset. Must be a non-negative integer.",
        });
      }
      // If offset is provided without limit, add a large LIMIT first
      if (limit === undefined) {
        sql += " LIMIT -1";
      }
      sql += " OFFSET ?";
      params.push(off);
    }

    const books = await allQuery(sql, params);

    res.status(200).json({
      total: books.length,
      books,
    });
  } catch (err) {
    console.error("❌ Error fetching books:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET /books/:id – Get a book by ID
app.get("/books/:id", async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (id === false) {
      return res.status(400).json({
        error: "Invalid book ID. Must be a positive integer.",
      });
    }

    const book = await getQuery("SELECT * FROM books WHERE id = ?", [id]);

    if (!book) {
      return res.status(404).json({
        error: `Book with ID ${id} not found.`,
      });
    }

    res.status(200).json({ book });
  } catch (err) {
    console.error("❌ Error fetching book:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /books – Add a new book
app.post("/books", async (req, res) => {
  try {
    const validationError = validateBookData(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = req.body;

    const result = await runQuery(
      "INSERT INTO books (title, author, price, pages) VALUES (?, ?, ?, ?)",
      [title.trim(), author.trim(), price, pages || null]
    );

    const newBook = await getQuery("SELECT * FROM books WHERE id = ?", [result.lastID]);

    res.status(201).json({
      message: "Book created successfully.",
      book: newBook,
    });
  } catch (err) {
    console.error("❌ Error creating book:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT /books/:id – Update an existing book
app.put("/books/:id", async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (id === false) {
      return res.status(400).json({
        error: "Invalid book ID. Must be a positive integer.",
      });
    }

    // Check if book exists
    const existingBook = await getQuery("SELECT * FROM books WHERE id = ?", [id]);
    if (!existingBook) {
      return res.status(404).json({
        error: `Book with ID ${id} not found.`,
      });
    }

    const validationError = validateBookData(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = req.body;

    await runQuery(
      "UPDATE books SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
      [title.trim(), author.trim(), price, pages || null, id]
    );

    const updatedBook = await getQuery("SELECT * FROM books WHERE id = ?", [id]);

    res.status(200).json({
      message: "Book updated successfully.",
      book: updatedBook,
    });
  } catch (err) {
    console.error("❌ Error updating book:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /books/:id – Delete a book
app.delete("/books/:id", async (req, res) => {
  try {
    const id = validateId(req.params.id);
    if (id === false) {
      return res.status(400).json({
        error: "Invalid book ID. Must be a positive integer.",
      });
    }

    const existingBook = await getQuery("SELECT * FROM books WHERE id = ?", [id]);
    if (!existingBook) {
      return res.status(404).json({
        error: `Book with ID ${id} not found.`,
      });
    }

    await runQuery("DELETE FROM books WHERE id = ?", [id]);

    res.status(200).json({
      message: `Book with ID ${id} deleted successfully.`,
      book: existingBook,
    });
  } catch (err) {
    console.error("❌ Error deleting book:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ─── 404 Handler – Missing Routes ───────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON in request body.",
    });
  }
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

// ─── Server Startup ─────────────────────────────────────────────────────────

async function startServer() {
  try {
    await initializeDatabase();
    console.log("✅ Database is ready.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
      console.log(`📖 API documentation available at http://localhost:${PORT}/`);
    }).on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
        console.error(`   PORT=3001 npm start`);
      } else {
        console.error("❌ Server error:", err.message);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeDatabase();
  process.exit(0);
});

startServer();

module.exports = app;

