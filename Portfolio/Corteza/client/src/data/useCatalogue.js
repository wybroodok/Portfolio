import { useEffect, useState } from 'react';

// Fallback catalogue — keeps the site fully rendered even before/without the API.
const FALLBACK = {
  maison: {
    name: 'CORTEZA',
    origin: 'Firenze, Italia',
    est: 'MCMXXIV',
    manifesto:
      'Occhiali forgiati a mano. Un tributo alla luce del Mediterraneo — dove il tempo rallenta e lo sguardo trova la sua misura.',
    manifestoEn:
      'Handmade eyewear — a tribute to Mediterranean light, where time slows and the gaze finds its measure.',
  },
  hero: {
    id: 'riviera',
    eyebrow: 'La Collezione — Estate',
    title: 'Corteza',
    model: 'Riviera',
    tagline: 'La luce, addomesticata.',
    image:
      'https://images.unsplash.com/photo-1610904329458-2512c4748c8d?auto=format&fit=crop&w=2400&q=80',
    imagePortrait:
      'https://images.unsplash.com/photo-1610904329458-2512c4748c8d?auto=format&fit=crop&w=2400&q=80',
  },
  collection: [],
};

/** Fetches the maison catalogue from the Node API, with a graceful fallback. */
export function useCatalogue() {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/catalogue')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => {
        if (!alive) return;
        setData(json);
      })
      .catch(() => alive && setData(FALLBACK))
      .finally(() => {
        if (!alive) return;
        // A poised, deliberate reveal — never instant.
        setTimeout(() => alive && setReady(true), 650);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data: data ?? FALLBACK, ready };
}
