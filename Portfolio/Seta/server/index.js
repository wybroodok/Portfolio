import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

// --- Simple in-memory rate limit so the contact endpoint can't be hammered ---
const HITS = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = 8;
function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = HITS.get(ip) ?? { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  HITS.set(ip, entry);
  if (entry.count > MAX_HITS) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  next();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'seta', time: new Date().toISOString() });
});

// Collaboration / contact submissions.
app.post('/api/contact', rateLimit, (req, res) => {
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

  const entry = {
    id: `msg_${Date.now().toString(36)}`,
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  };

  // Persist to a newline-delimited JSON log. In production this would be an
  // email dispatch / CRM call; the shape stays the same.
  try {
    fs.appendFileSync(
      path.join(__dirname, 'inbox.log'),
      JSON.stringify(entry) + '\n'
    );
  } catch (err) {
    console.error('Failed to persist contact entry:', err);
  }

  console.log(`✉  New collaboration request from ${entry.name} <${entry.email}>`);
  res.status(201).json({ ok: true, id: entry.id });
});

// --- Serve the built client in production ---
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.type('text').send('Seta API running. Build the client to serve the site.');
  });
}

app.listen(PORT, () => {
  console.log(`\n  SETA server  →  http://localhost:${PORT}\n`);
});
