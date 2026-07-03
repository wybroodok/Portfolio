# Portfolio

An ultra-minimalist, premium dark-mode portfolio — deep black (`#0A0A0A`) with a
quiet neon-green accent (`#00FF9D`). Built as a React + Node.js app with a
centralized, enum-driven router and Framer Motion transitions (including
`matchedGeometryEffect`-style shared elements).

## Stack

- **Client** — React 18 + Vite, Framer Motion for all motion.
- **Server** — Node.js + Express serving the content API (and the built client in production).
- **Routing** — a custom `Route` enum + React Context (`RouterContext`) drives a single
  `AppRouter` destination switcher. No page-router boilerplate; navigation is a value change.

## Structure

```
Portfolio/
├─ server/                 # Express API
│  ├─ index.js
│  └─ data/content.js      # ← edit projects, profile & socials here
└─ client/                 # Vite + React app
   └─ src/
      ├─ router/           # Route enum + RouterContext (the "Destination Switcher")
      ├─ components/        # TabBar, ProjectCard, SocialLink, Loader, Background
      ├─ pages/             # Main, AllProducts, Contact, ProjectDetail
      └─ styles/            # Design tokens (index.css) + app.css
```

## Features

- **Main** — hero + featured work as large interactive cards.
- **All products** — full archive as editorial rows with dull-gray, high-legibility summaries.
- **Contact** — profile + social links styled as editorial rows (not default buttons) with elegant hover.
- **Shared-element transitions** — clicking a card animates its hero into the detail page (`layoutId`).
- **Tab pill** — the active tab indicator glides between tabs with a spring (`layoutId`).
- Deep-linkable URLs, back/forward support, reduced-motion friendly.

## Getting started

```bash
# install everything (root, server, client)
npm run install:all

# run API (:4000) + client (:5173) together with hot reload
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the Express server.

## Sub-projects (subpaths)

Each project links to a live demo served under its own subpath by the Express server:

| Project   | URL         | How it's served                                                        |
|-----------|-------------|------------------------------------------------------------------------|
| Corteza   | `/Corteza`  | Static Vite build (`base=/Corteza/`); API merged into this server.     |
| Seta      | `/Seta`     | Static Vite build (`base=/Seta/`); API merged into this server.        |
| LogiqAI   | `/LogiqAI`  | Static Vite build (`base=/LogiqAI/`). **Backend wired separately.**    |
| Talkly    | `/Talkly`   | Static Vite build (`base=/Talkly/`). **Backend wired separately.**     |
| Kinetik   | `/Kinetik`  | Next.js app reverse-proxied (`basePath=/Kinetik`). **Run separately.** |
| GlowSpace | `t.me` link | Telegram Mini App — opens in Telegram, no subpath.                     |

**Rebuilding a static sub-app** (after changing its source): build it with the matching base, e.g.

```bash
cd LogiqAI/frontend && npx vite build --base=/LogiqAI/
cd Talkly/client   && npx vite build --base=/Talkly/
```

**Wiring the servers** (`LogiqAI`, `Talkly`) — their frontends call `/api/...` (LogiqAI) or
`VITE_SOCKET_URL` (Talkly, default `http://localhost:4000`). Start each project's backend and
either merge its routes into this server (as Corteza/Seta do) or reverse-proxy to it.

**Kinetik** is a full Next.js app, so it runs as its own process and this server proxies to it:

```bash
cd Kinetik && npm install && npm run build && npm start -- -p 3001
# override the target with KINETIK_ORIGIN if you run it elsewhere
```

Until that process is up, `/Kinetik` returns a 502.

## Production

```bash
npm run build          # builds the client into client/dist
NODE_ENV=production npm start   # Express serves the API + built client on :4000
```

## Editing content

All content lives in [`server/data/content.js`](server/data/content.js) — projects
(`featured: true` surfaces them on Main), the profile bio, and social links. No app
code needs to change to swap in real work.
