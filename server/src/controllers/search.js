import pool from '../db.js';
import { buildLikeQuery } from '../utils/helpers.js';

export async function globalSearch(req, res) {
  try {
    const { q } = req.query;
    const like = buildLikeQuery(q);
    if (!like) return res.json({ books: [], bookmarks: [] });

    const [bookRows] = await pool.query(
      `SELECT * FROM books WHERE LOWER(title) LIKE ?
       OR LOWER(author1) LIKE ? OR LOWER(author2) LIKE ? OR LOWER(author3) LIKE ? OR LOWER(author4) LIKE ?`,
      [like, like, like, like, like]
    );

    const [bmRows] = await pool.query(
      `SELECT * FROM bookmarks WHERE LOWER(summary) LIKE ? ORDER BY created_at DESC`,
      [like]
    );

    res.json({ books: bookRows, bookmarks: bmRows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to search' });
  }
}
