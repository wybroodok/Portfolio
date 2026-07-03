import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Loader from './components/Loader.jsx';
import TabBar from './components/TabBar.jsx';
import NavArrows from './components/NavArrows.jsx';
import AppRouter from './router/AppRouter.jsx';
import Footer from './components/Footer.jsx';
import { useRouter } from './store/useRouter.js';

import './components/SmartImage.css';
import './styles/app.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const route = useRouter((s) => s.route);

  // Keep the viewport pinned to the top through the intro, then reveal.
  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => {
      window.scrollTo(0, 0);
      setLoading(false);
    }, 2100);
    return () => clearTimeout(t);
  }, []);

  // Keep the viewport at the top whenever the destination changes.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  // Arrow-key navigation as a keyboard affordance for the side arrows.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') useRouter.getState().next();
      if (e.key === 'ArrowLeft') useRouter.getState().prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <AnimatePresence>{loading && <Loader key="loader" />}</AnimatePresence>

      <TabBar />
      <NavArrows />
      <AppRouter />
      <Footer />
    </>
  );
}
