import { Router } from 'express';
import { listBookmarks, getBookmark, createBookmark, updateBookmark, deleteBookmark, searchBookmarks } from '../controllers/bookmarks.js';
const router = Router();

router.get('/', listBookmarks);
router.get('/search', searchBookmarks);
router.get('/:id', getBookmark);
router.post('/', createBookmark);
router.put('/:id', updateBookmark);
router.delete('/:id', deleteBookmark);

export default router;
