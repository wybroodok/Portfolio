import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from '../store/useRouter.js';
import { Route } from './routes.js';
import Main from '../pages/Main.jsx';
import Seta from '../pages/Seta.jsx';

// The single destination switcher. It maps the active route enum to a page
// component and wraps it in a directional slide/fade transition. `direction`
// (from the router store) decides whether pages enter from the left or right.
const PAGES = {
  [Route.MAIN]: Main,
  [Route.SETA]: Seta,
};

const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80, filter: 'blur(6px)' }),
};

export default function AppRouter() {
  const route = useRouter((s) => s.route);
  const direction = useRouter((s) => s.direction);
  const Page = PAGES[route] ?? Main;

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.main
        key={route}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="page"
      >
        <Page />
      </motion.main>
    </AnimatePresence>
  );
}
