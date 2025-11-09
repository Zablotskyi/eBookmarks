import pool from '../db.js';
import { buildLikeQuery, mapBookmark } from '../utils/helpers.js';

export async function listBookmarks(req, res) {
  try {
    const { book_id } = req.query;
    let sql = 'SELECT * FROM bookmarks';
    const params = [];
    if (book_id) { sql += ' WHERE book_id = ?'; params.push(Number(book_id)); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapBookmark));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
}

export async function getBookmark(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM bookmarks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Bookmark not found' });
    res.json(mapBookmark(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch bookmark' });
  }
}

export async function createBookmark(req, res) {
  try {
    const { book_id, page, summary } = req.body;
    if (!book_id || !page || !summary) return res.status(400).json({ error: 'book_id, page, summary are required' });
    const [result] = await pool.query(
      'INSERT INTO bookmarks (book_id, page, summary) VALUES (?, ?, ?)',
      [book_id, page, summary]
    );
    const [rows] = await pool.query('SELECT * FROM bookmarks WHERE id = ?', [result.insertId]);
    res.status(201).json(mapBookmark(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create bookmark' });
  }
}

export async function updateBookmark(req, res) {
  try {
    const id = req.params.id;
    const { book_id, page, summary } = req.body;
    const [exists] = await pool.query('SELECT id FROM bookmarks WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Bookmark not found' });
    await pool.query(
      'UPDATE bookmarks SET book_id=?, page=?, summary=? WHERE id=?',
      [book_id, page, summary, id]
    );
    const [rows] = await pool.query('SELECT * FROM bookmarks WHERE id = ?', [id]);
    res.json(mapBookmark(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
}

export async function deleteBookmark(req, res) {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM bookmarks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
}

export async function searchBookmarks(req, res) {
  try {
    const { q, book_id } = req.query;
    let sql = 'SELECT * FROM bookmarks WHERE 1=1';
    const params = [];
    if (book_id) { sql += ' AND book_id = ?'; params.push(Number(book_id)); }
    const like = buildLikeQuery(q);
    if (like) { sql += ' AND LOWER(summary) LIKE ?'; params.push(like); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapBookmark));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to search bookmarks' });
  }
}
