# SETA — Wear Your Freedom

A production-ready website for the premium apparel brand **Seta**. Deep-black
dark mode, a subtle orange ember, and an atmosphere of freedom.

![Seta](client/public/favicon.svg)

## Highlights

- **Two destinations, one switcher.** A centralized router (Zustand store +
  route enum) drives navigation. `AppRouter` renders the active page from the
  enum; the small **side arrows** and the top **tab bar** both walk the same
  ordered destination list.
- **Cursor-driven x-ray hero.** On **Main**, the same figure is shown in two
  looks stacked on top of each other. A soft lens follows the cursor and punches
  through the top layer with a CSS mask — pointing at the model "x-rays" him
  into an alternate Seta outfit.
- **Framer Motion throughout.** Directional page transitions, a shared-layout
  tab pill (the `matchedGeometryEffect` analog via `layoutId`), spring
  animations, scroll fade-ins, an intro loader, and interactive buttons.
- **Real Node.js backend.** Express API with a validated, rate-limited
  `/api/contact` endpoint that the Seta collaboration form posts to. In
  production the server also serves the built client.
- **Resilient imagery.** Editorial photos stream from the Unsplash CDN; every
  image degrades to an on-brand placeholder if a URL ever fails.

## Stack

| Layer     | Tech                                     |
| --------- | ---------------------------------------- |
| Frontend  | React 18, Vite 6, Framer Motion, Zustand |
| Backend   | Node.js, Express                         |
| Styling   | Hand-authored CSS design system          |

## Getting started

```bash
# from the repo root — installs client + server via npm workspaces
npm install

# run client (Vite :5173) and server (Express :4000) together
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the
Express server, so the contact form works end-to-end in development.

### Production

```bash
npm run build     # builds the client into client/dist
npm start         # Express serves the API + the built site on :4000
```

Then open **http://localhost:4000**.

## Project structure

```
Seta/
├── client/                 # Vite + React frontend
│   └── src/
│       ├── router/         # route enum + AppRouter (destination switcher)
│       ├── store/          # Zustand navigation store
│       ├── components/     # TabBar, NavArrows, Loader, SmartImage, …
│       ├── sections/       # XRayHero, Gallery, Slogans, Stats, ContactForm
│       ├── pages/          # Main, Seta
│       └── data/           # content + imagery
└── server/                 # Express API (+ serves client/dist in prod)
```

## Navigation

- Top tabs: **Main** / **Seta**
- Side arrows (left/right edges) step through destinations
- `←` / `→` arrow keys do the same

## Contact

Collaboration enquiries: **atelier@seta.studio**
