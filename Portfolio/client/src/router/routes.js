/**
 * Route is the canonical enum of destinations in the app. The whole app
 * navigates by switching this enum value rather than by matching URL strings,
 * which keeps navigation type-safe and makes the shared-element transitions
 * (Framer Motion `layoutId`) trivial to reason about.
 */
export const Route = Object.freeze({
  MAIN: 'main',
  ALL_PRODUCTS: 'all-products',
  CONTACT: 'contact',
  PROJECT: 'project',
});

/** Tabs shown in the top navigation, in order. */
export const TABS = [
  { route: Route.MAIN, label: 'Main' },
  { route: Route.ALL_PRODUCTS, label: 'All products' },
  { route: Route.CONTACT, label: 'Contact' },
];

/** Map a browser path <-> a { route, params } destination for deep-linking. */
export function pathToDestination(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/main') return { route: Route.MAIN, params: {} };
  if (clean === '/work' || clean === '/all-products')
    return { route: Route.ALL_PRODUCTS, params: {} };
  if (clean === '/contact') return { route: Route.CONTACT, params: {} };
  const match = clean.match(/^\/work\/(.+)$/);
  if (match) return { route: Route.PROJECT, params: { id: match[1] } };
  return { route: Route.MAIN, params: {} };
}

export function destinationToPath(route, params = {}) {
  switch (route) {
    case Route.MAIN:
      return '/';
    case Route.ALL_PRODUCTS:
      return '/work';
    case Route.CONTACT:
      return '/contact';
    case Route.PROJECT:
      return `/work/${params.id}`;
    default:
      return '/';
  }
}

/** Which tab should read as "active" for a given route (project rolls up to work). */
export function activeTabFor(route) {
  if (route === Route.PROJECT) return Route.ALL_PRODUCTS;
  return route;
}
