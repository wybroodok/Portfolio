import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Route,
  pathToDestination,
  destinationToPath,
  activeTabFor,
} from './routes.js';

/**
 * Centralized in-app router built on a route enum + params, exposed through
 * React Context. It keeps navigation state, syncs it with the browser URL
 * (so links are shareable and back/forward work), and hands the active
 * destination to the AppRouter switcher for rendering.
 */
const RouterCtx = createContext(null);

export function RouterProvider({ children }) {
  const [destination, setDestination] = useState(() =>
    pathToDestination(window.location.pathname)
  );

  const navigate = useCallback((route, params = {}) => {
    setDestination((prev) => {
      if (prev.route === route && prev.params.id === params.id) return prev;
      const path = destinationToPath(route, params);
      window.history.pushState({ route, params }, '', path);
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      return { route, params };
    });
  }, []);

  const goToProject = useCallback((id) => navigate(Route.PROJECT, { id }), [navigate]);

  // Keep in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => setDestination(pathToDestination(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const value = useMemo(
    () => ({
      route: destination.route,
      params: destination.params,
      activeTab: activeTabFor(destination.route),
      navigate,
      goToProject,
    }),
    [destination, navigate, goToProject]
  );

  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error('useRouter must be used within a RouterProvider');
  return ctx;
}
