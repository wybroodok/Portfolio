import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useRouter } from './router/RouterContext.jsx';
import { Route } from './router/routes.js';
import { Background } from './components/Background.jsx';
import { TabBar } from './components/TabBar.jsx';
import { MainPage } from './pages/MainPage.jsx';
import { AllProductsPage } from './pages/AllProductsPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.jsx';
import './styles/app.css';

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28, ease: [0.65, 0, 0.35, 1] } },
};

/**
 * AppRouter — the single destination switcher. It maps the current route enum
 * to a page component. Every page is wrapped in the same motion shell so
 * transitions are consistent, while shared `layoutId` elements animate across
 * pages via the surrounding LayoutGroup.
 */
function AppRouter() {
  const { route, params } = useRouter();

  // Keying by route (project detail keyed by id) drives AnimatePresence.
  const key = route === Route.PROJECT ? `project-${params.id}` : route;

  let page;
  switch (route) {
    case Route.MAIN:
      page = <MainPage />;
      break;
    case Route.ALL_PRODUCTS:
      page = <AllProductsPage />;
      break;
    case Route.CONTACT:
      page = <ContactPage />;
      break;
    case Route.PROJECT:
      page = <ProjectDetailPage id={params.id} />;
      break;
    default:
      page = <MainPage />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={key}
        className="page"
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {page}
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LayoutGroup>
      <Background />
      <div className="shell">
        <SiteHeader />
        <AppRouter />
        <SiteFooter />
      </div>
    </LayoutGroup>
  );
}

function SiteHeader() {
  const { navigate } = useRouter();
  return (
    <header className="site-header">
      <button className="wordmark" onClick={() => navigate(Route.MAIN)} aria-label="Home">
        <span className="wordmark__dot" />
        <span className="wordmark__text">wybroodok</span>
      </button>
      <TabBar />
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="mono">© {new Date().getFullYear()} wybroodok</span>
      <span className="mono site-footer__disclaimer">
        All projects shown are sample works for demonstration only — not real, existing products.
      </span>
      <span className="mono site-footer__status">
        <i className="pulse" /> Available for work
      </span>
    </footer>
  );
}
