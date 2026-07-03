# ⚡ LogiqAI

**AI-powered automated audit intelligence** — upload code, financial spend, or a
résumé and get a structured audit with a health score, interactive analytics, and
prioritized AI recommendations.

Tech-Cyber minimalism UI · deep graphite surfaces · glassmorphic cards · neon
analytics.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | **FastAPI** (fully async, `BackgroundTasks`) | Modern, fast, no Django |
| AI | **Google Gemini** (`gemini-2.0-flash`, free tier) with **Structured Output** | Strictly-valid JSON constrained to a Pydantic schema |
| Validation | **Pydantic v2** | Request + AI-response contracts |
| Frontend | **React + Vite** | Fast dev, component model |
| Charts | **Recharts** | Interactive area + donut with custom tooltips |
| State | **Zustand** | Lightweight audit state |
| Animation | **Framer Motion** | Tab transitions, chart reveals, collapsible insights |

**Real AI only.** A Gemini API key is required. If the key is missing or the
provider call fails (bad token, quota, model error), `/api/analyze` returns
**503** and the UI shows "temporarily unavailable" — there is no mock fallback.

---

## Quick start

### 1. Backend (port 8000)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # optional
pip install -r requirements.txt

# Optional: enable real AI analysis (free Gemini key)
cp .env.example .env        # then paste your GEMINI_API_KEY
#   get a free key at https://aistudio.google.com  ->  "Get API key"

uvicorn main:app --reload --port 8000
```

Health check: <http://localhost:8000/api/health> → `{"ai_enabled": true | false}`.

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api/*` to the backend automatically.

> No valid key? The sidebar shows **Service unavailable** and any upload returns a
> "temporarily unavailable" message. With a key configured, drop in any `.py`,
> `.csv`, or `.txt`/résumé file — Gemini detects which of the three audit types
> fits and responds accordingly.

---

## How it flows

```
Upload file  ──▶  POST /api/analyze  ──▶  async → Gemini (Structured Output)
                                              │        └─ AI unavailable? → 503
                                              ▼
                              validated AuditResult (Pydantic)
                                              │
                     BackgroundTask "persists" the audit (imitation DB)
                                              ▼
                        JSON response → Zustand → 3 animated tabs
```

### Pages

1. **Dashboard & Upload** — drag-and-drop dropzone, cyber progress loader, score
   ring, and 3–4 summary metric cards.
2. **Analytics** — animated **Area chart** (trend vs. baseline) + **Donut chart**
   (category distribution), both with custom on-brand tooltips.
3. **AI Insights** — recommendations grouped by **Critical / Important / Tips**
   with red/amber/green indicators and collapsible detail blocks.

---

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service status + whether AI is enabled |
| `POST` | `/api/analyze` | Multipart file upload → structured `AuditResult` |
| `GET` | `/api/audits` | Recently persisted audits (in-memory demo store) |

Accepted uploads: `.json .csv .txt .pdf .md .py .js .ts` (≤ 5 MB).

---

## Project layout

```
LogiqAI/
├── backend/
│   ├── main.py          # FastAPI app, endpoints, background persistence
│   ├── ai_service.py    # Gemini structured-output call (503 if unavailable)
│   ├── models.py        # Pydantic schemas (request + AuditResult)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx           # Shell + animated tab router
    │   ├── store.js          # Zustand state + upload flow
    │   ├── theme.js          # Shared palette (fixed categorical order)
    │   ├── pages/            # Dashboard · Analytics · Insights
    │   └── components/       # Dropzone, CyberLoader, charts, cards, …
    └── vite.config.js        # /api proxy → :8000
```
