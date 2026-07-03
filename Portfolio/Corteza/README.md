# CORTEZA — Maison di Occhiali

Production-ready website for **Corteza**, a fictional premium Italian eyewear house.
Ultra-minimalist dark mode (`#0A0A0A`), a subtle orange accent, and the atmosphere
of _dorogaya italyanskaya roskosh_ — expensive Italian taste for life.

Built with **React + Vite** on the front end and **Node.js (Express)** serving the
catalogue API and the production build.

## Highlights

- **Enum-driven central router** (`src/store/useRouter.js`, Zustand). A single
  `<AppRouter>` "Destination Switcher" maps a `destination` enum to a screen —
  no URL library, just state.
- **Two long tabs**: _La Collezione_ (home) & _La Maison_ (story).
- **Framer Motion** throughout: page fade/scale/slide transitions, spring tab
  underline, scroll-reveal, parallax hero, an editorial loader, and a
  **shared-element / matchedGeometryEffect** flight (`layoutId`) from a model card
  into its full-screen detail view.
- **Resilient imagery** — remote editorial photos with a graceful tonal-gradient
  fallback (`SmartImage`), so the site stays premium even offline.
- **Node API** is the single source of truth for the collection.

## Getting started

```bash
npm run install:all   # install root + server + client deps
npm run dev           # Express :4000 + Vite :5173 (proxied)
```

Open **http://localhost:5173**.

### Production

```bash
npm run build         # builds the client into client/dist
npm start             # Express serves the API + built client on :4000
```

## API

| Route                   | Description                     |
| ----------------------- | ------------------------------- |
| `GET /api/catalogue`    | Maison + hero + full collection |
| `GET /api/hero`         | The seasonal editorial hero     |
| `GET /api/collection`   | All models                      |
| `GET /api/collection/:id` | A single model                |

## Structure

```
server/            Express API + static host
  data/collection.js   the catalogue (source of truth)
client/
  src/
    store/useRouter.js     central enum router (Zustand)
    router/AppRouter.jsx   Destination Switcher
    data/useCatalogue.js   API fetch + fallback
    pages/                 Collezione · Maison · ProductDetail
    components/            Loader · Navigation · ModelCard · SmartImage
```

Model names: Riviera · Fiorentina · Milano Nero · Aviatore · Veneziano · Solaro.
