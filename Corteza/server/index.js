import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import catalogue, { collection, hero, maison } from './data/collection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(compression());
app.use(cors());
app.use(express.json());

// ── API ──────────────────────────────────────────────────────────────────────
const api = express.Router();

api.get('/health', (_req, res) => res.json({ status: 'ok', maison: maison.name }));

api.get('/catalogue', (_req, res) => res.json(catalogue));

api.get('/hero', (_req, res) => res.json(hero));

api.get('/collection', (_req, res) => res.json(collection));

api.get('/collection/:id', (req, res) => {
  const model = collection.find((m) => m.id === req.params.id);
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
});

app.use('/api', api);

// ── Static (production build of the client) ──────────────────────────────────
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(200).send('Corteza API is running. Build the client with `npm run build`.');
  });
});

app.listen(PORT, () => {
  console.log(`\n  CORTEZA · Maison API`);
  console.log(`  → http://localhost:${PORT}/api/collection\n`);
});
