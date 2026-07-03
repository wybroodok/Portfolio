import { motion } from 'framer-motion';
import { useRouter, DESTINATIONS } from '../store/useRouter.js';

const TABS = [
  { id: DESTINATIONS.COLLEZIONE, label: 'La Collezione' },
  { id: DESTINATIONS.MAISON, label: 'La Maison' },
];

/** Fixed top bar with the two long tabs — the app's only navigation. */
export default function Navigation({ maison }) {
  const destination = useRouter((s) => s.destination);
  const navigate = useRouter((s) => s.navigate);
  const closeProduct = useRouter((s) => s.closeProduct);

  return (
    <motion.header
      className="nav"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        className="nav__brand display"
        onClick={() => {
          closeProduct();
          navigate(DESTINATIONS.COLLEZIONE);
        }}
      >
        {maison?.name || 'CORTEZA'}
        <span className="nav__brand-dot" />
      </button>

      <nav className="nav__tabs">
        {TABS.map((tab) => {
          const active = destination === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav__tab ${active ? 'is-active' : ''}`}
              onClick={() => navigate(tab.id)}
            >
              <span>{tab.label}</span>
              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="nav__tab-underline"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </nav>

    </motion.header>
  );
}
