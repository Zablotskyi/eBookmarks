import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

import booksRouter from './routes/books.js';
import bookmarksRouter from './routes/bookmarks.js';
import searchRouter from './routes/search.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/books', booksRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/search', searchRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
