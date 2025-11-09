import { Router } from 'express';
import { listBooks, getBook, createBook, updateBook, deleteBook, filterBooks } from '../controllers/books.js';
const router = Router();

router.get('/', listBooks);
router.get('/filter', filterBooks);
router.get('/:id', getBook);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
