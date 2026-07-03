import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, DESTINATIONS } from '../store/useRouter.js';
import Collezione from '../pages/Collezione.jsx';
import Maison from '../pages/Maison.jsx';
import ProductDetail from '../pages/ProductDetail.jsx';

const pageMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

/**
 * Destination Switcher — the single component that maps the router's
 * `destination` enum to a screen, and layers the product detail on top.
 */
export default function AppRouter({ data }) {
  const destination = useRouter((s) => s.destination);
  const product = useRouter((s) => s.product);

  const activeModel = product
    ? data.collection.find((m) => m.id === product)
    : null;

  return (
    <main className="stage">
      <AnimatePresence mode="wait">
        {destination === DESTINATIONS.COLLEZIONE && (
          <motion.div key="collezione" {...pageMotion}>
            <Collezione data={data} />
          </motion.div>
        )}

        {destination === DESTINATIONS.MAISON && (
          <motion.div key="maison" {...pageMotion}>
            <Maison data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModel && <ProductDetail key="product" model={activeModel} />}
      </AnimatePresence>
    </main>
  );
}
