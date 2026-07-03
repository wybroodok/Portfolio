// Route enum — the single source of truth for navigable destinations.
// The AppRouter renders a component based on the active enum value, and the
// side arrows walk this ordered list.
export const Route = Object.freeze({
  MAIN: 'MAIN',
  SETA: 'SETA',
});

// Ordered list drives the left/right arrow navigation and the tab bar.
export const DESTINATIONS = [
  {
    id: Route.MAIN,
    label: 'Main',
    index: '01',
    caption: 'The Collection',
  },
  {
    id: Route.SETA,
    label: 'Seta',
    index: '02',
    caption: 'The House',
  },
];

export const routeIndex = (route) => DESTINATIONS.findIndex((d) => d.id === route);
