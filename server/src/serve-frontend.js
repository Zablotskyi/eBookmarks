import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const frontendDir = process.env.FRONTEND_DIR ? path.resolve(__dirname, process.env.FRONTEND_DIR) : path.resolve(__dirname, '../../frontend');

app.use('/api', (await import('./index.js')).default); // Not ideal in real apps; kept simple here.

app.use(express.static(frontendDir));
app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Serving frontend from ${frontendDir} on http://localhost:${port}`);
});
