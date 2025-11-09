# eBookMarks (Node.js + MySQL)

A Web app to manage books and electronic bookmarks (page + short summary), with global search, filters, CRUD, and light/dark theme.

## Stack
- Frontend: HTML, CSS, JavaScript (single-page)
- Backend: Node.js, Express
- DB: MySQL (`mysql2/promise`)

## Features
- Books: title, year, up to 4 authors, start & finish dates
- Bookmarks: page number + short summary linked to a book
- Global search across books & bookmark summaries
- Filter by any field
- Edit/update both books and bookmarks
- Light/Dark theme toggle
- Alphabetical list of books
- REST API

## Quick Start

1) **Create DB & user** (example):
```sql
CREATE DATABASE ebookmarks DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ebook'@'localhost' IDENTIFIED BY 'ebookpass';
GRANT ALL PRIVILEGES ON ebookmarks.* TO 'ebook'@'localhost';
FLUSH PRIVILEGES;
```

2) **Apply schema**:
```bash
mysql -u ebook -p ebookmarks < server/db/schema.sql
```

3) **Configure env**:
Copy `server/.env.example` to `server/.env` and adjust values.

4) **Install & run backend**:
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`.

5) **Open frontend**:
Open `frontend/index.html` directly in a browser OR serve it (see `npm run static`).

> Tip: For same-origin, run: `npm run static` (serves frontend at `/` and API under `/api`).

