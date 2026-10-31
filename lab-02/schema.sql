CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);

INSERT INTO book (title, author, price, pages) VALUES
  ('The Alchemist', 'Paulo Coelho', 299, 208),
  ('Wings of Fire', 'A. P. J. Abdul Kalam', 350, 180),
  ('The Guide', 'R. K. Narayan', 275, 220),
  ('Train to Pakistan', 'Khushwant Singh', 320, 181),
  ('The White Tiger', 'Aravind Adiga', 399, 321),
  ('Godan', 'Munshi Premchand', 250, 344),
  ('Malgudi Days', 'R. K. Narayan', 260, 256),
  ('The God of Small Things', 'Arundhati Roy', 450, 340),
  ('Gitanjali', 'Rabindranath Tagore', 199, 112),
  ('Midnight''s Children', 'Salman Rushdie', 499, 647);
