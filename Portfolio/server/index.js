import express from 'express';
import cors from 'cors';
import compression from 'compression';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  profile,
  projects,
  reviews,
  getFeaturedProjects,
  getProjectById,
} from './data/content.js';

// Sub-projects served under their own subpaths (/Corteza, /Seta). Their APIs are
// mounted on this shared server so the built apps work end to end.
import cortezaCatalogue, {
  collection as cortezaCollection,
  hero as cortezaHero,
} from '../Corteza/server/data/collection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
const projectRoot = path.resolve(__dirname, '..');

const app = express();
app.use(cors());
app.use(compression());

// ── Kinetik (Next.js) reverse-proxied under /Kinetik ─────────────────────────
// Kinetik isn't a static build — it's a full Next.js app (Server Actions + Postgres).
// Run it standalone (`npm run build && npm start` in Kinetik/, it listens on
// KINETIK_ORIGIN with basePath=/Kinetik) and this forwards /Kinetik/* to it.
// Registered before express.json so request bodies stream through untouched.
// Returns 502 while that server is down.
const KINETIK_ORIGIN = process.env.KINETIK_ORIGIN || 'http://localhost:3001';
const kinetikTarget = new URL(KINETIK_ORIGIN);
app.use('/Kinetik', (req, res) => {
  const proxyReq = http.request(
    {
      protocol: kinetikTarget.protocol,
      hostname: kinetikTarget.hostname,
      port: kinetikTarget.port,
      method: req.method,
      path: req.originalUrl, // keeps the /Kinetik prefix Next expects via basePath
      headers: { ...req.headers, host: kinetikTarget.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Kinetik server is not running.' });
    }
  });
  req.pipe(proxyReq);
});

app.use(express.json());

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

api.get('/profile', (_req, res) => {
  res.json(profile);
});

api.get('/reviews', (_req, res) => {
  res.json(reviews);
});

api.get('/projects', (req, res) => {
  const { featured } = req.query;
  const list = featured === 'true' ? getFeaturedProjects() : projects;
  // Keep list payloads lean — omit the long-form description.
  res.json(list.map(({ description, ...rest }) => rest));
});

api.get('/projects/:id', (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// ── Corteza API (consumed by the app served at /Corteza) ─────────────────────
api.get('/catalogue', (_req, res) => res.json(cortezaCatalogue));
api.get('/hero', (_req, res) => res.json(cortezaHero));
api.get('/collection', (_req, res) => res.json(cortezaCollection));
api.get('/collection/:id', (req, res) => {
  const model = cortezaCollection.find((m) => m.id === req.params.id);
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
});

// ── Seta API (consumed by the app served at /Seta) ───────────────────────────
const SETA_HITS = new Map();
const SETA_WINDOW_MS = 60_000;
const SETA_MAX_HITS = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Evict stale rate-limit entries so the map can't grow unbounded across many IPs.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of SETA_HITS) {
    if (now - entry.start > SETA_WINDOW_MS) SETA_HITS.delete(ip);
  }
}, SETA_WINDOW_MS).unref();
api.post('/contact', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = SETA_HITS.get(ip) ?? { count: 0, start: now };
  if (now - entry.start > SETA_WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  SETA_HITS.set(ip, entry);
  if (entry.count > SETA_MAX_HITS) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const { name, email, message } = req.body ?? {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide a valid name.' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).json({ error: 'Your message is a little short.' });
  }
  console.log(`✉  New Seta collaboration request from ${name.trim()} <${email.trim()}>`);
  res.status(201).json({ ok: true, id: `msg_${Date.now().toString(36)}` });
});

app.use('/api', api);

// ── Sub-projects served under their own subpaths ─────────────────────────────
// Each is an independent built app (Vite base = /Corteza/ or /Seta/). Served in
// every mode so the "Visit project" links resolve during dev and in production.
function mountSubApp(mountPath, dist) {
  app.use(mountPath, express.static(dist));
  app.get(`${mountPath}/*`, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}
mountSubApp('/Corteza', path.join(projectRoot, 'Corteza/client/dist'));
mountSubApp('/Seta', path.join(projectRoot, 'Seta/client/dist'));
// Static Vite SPAs. Their own backends (FastAPI for LogiqAI, Node+Socket.io for
// Talkly) are wired separately — until then their /api & socket calls just 404/fail.
mountSubApp('/LogiqAI', path.join(projectRoot, 'LogiqAI/frontend/dist'));
mountSubApp('/Talkly', path.join(projectRoot, 'Talkly/client/dist'));

// Serve the built portfolio client in production (single-service deploy).
if (isProd) {
  const clientDist = path.resolve(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`◆ Portfolio API listening on http://localhost:${PORT}`);
});
