import pool from '../db.js';
import { buildLikeQuery, mapBook } from '../utils/helpers.js';

export async function listBooks(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY title ASC');
    res.json(rows.map(mapBook));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
}

export async function getBook(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json(mapBook(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
}

export async function createBook(req, res) {
  try {
    const { title, year, author1, author2, author3, author4, start_date, end_date } = req.body;
    if (!title || !year || !author1) return res.status(400).json({ error: 'title, year, author1 are required' });
    const [result] = await pool.query(
      `INSERT INTO books (title, year, author1, author2, author3, author4, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, year, author1, author2 || null, author3 || null, author4 || null, start_date || null, end_date || null]
    );
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(mapBook(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create book' });
  }
}

export async function updateBook(req, res) {
  try {
    const id = req.params.id;
    const { title, year, author1, author2, author3, author4, start_date, end_date } = req.body;
    const [exists] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Book not found' });
    await pool.query(
      `UPDATE books SET title=?, year=?, author1=?, author2=?, author3=?, author4=?, start_date=?, end_date=? WHERE id=?`,
      [title, year, author1, author2 || null, author3 || null, author4 || null, start_date || null, end_date || null, id]
    );
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    res.json(mapBook(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update book' });
  }
}

export async function deleteBook(req, res) {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM books WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete book' });
  }
}

export async function filterBooks(req, res) {
  try {
    const {
      q, title, year, author1, author2, author3, author4,
      start_date, end_date
    } = req.query;

    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    const pushLike = (field, value) => {
      const like = buildLikeQuery(value);
      if (like) { sql += ` AND LOWER(${field}) LIKE ?`; params.push(like); }
    };

    if (q) {
      const like = buildLikeQuery(q);
      if (like) {
        sql += ' AND (LOWER(title) LIKE ? OR LOWER(author1) LIKE ? OR LOWER(author2) LIKE ? OR LOWER(author3) LIKE ? OR LOWER(author4) LIKE ?)';
        params.push(like, like, like, like, like);
      }
    }

    pushLike('title', title);
    if (year) { sql += ' AND year = ?'; params.push(Number(year)); }
    pushLike('author1', author1);
    pushLike('author2', author2);
    pushLike('author3', author3);
    pushLike('author4', author4);

    if (start_date) { sql += ' AND (start_date IS NOT NULL AND start_date >= ?)'; params.push(start_date); }
    if (end_date) { sql += ' AND (end_date IS NOT NULL AND end_date <= ?)'; params.push(end_date); }

    sql += ' ORDER BY title ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapBook));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to filter books' });
  }
}
