import { create } from 'zustand';
import { DESTINATIONS, Route, routeIndex } from '../router/routes.js';

// Centralized navigation state. `direction` records whether we moved forward
// (+1) or backward (-1) so page transitions can slide the correct way.
export const useRouter = create((set, get) => ({
  route: Route.MAIN,
  direction: 1,

  goTo: (route) => {
    const current = get().route;
    if (route === current) return;
    const dir = routeIndex(route) > routeIndex(current) ? 1 : -1;
    set({ route, direction: dir });
  },

  next: () => {
    const i = routeIndex(get().route);
    const target = DESTINATIONS[Math.min(i + 1, DESTINATIONS.length - 1)];
    if (target.id !== get().route) set({ route: target.id, direction: 1 });
  },

  prev: () => {
    const i = routeIndex(get().route);
    const target = DESTINATIONS[Math.max(i - 1, 0)];
    if (target.id !== get().route) set({ route: target.id, direction: -1 });
  },

  canPrev: () => routeIndex(get().route) > 0,
  canNext: () => routeIndex(get().route) < DESTINATIONS.length - 1,
}));
