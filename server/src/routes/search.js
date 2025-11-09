import { Router } from 'express';
import { globalSearch } from '../controllers/search.js';
const router = Router();

router.get('/', globalSearch);

export default router;
