import { motion } from 'framer-motion';
import { useRouter } from '../store/useRouter.js';
import { DESTINATIONS } from '../router/routes.js';
import Logo from './Logo.jsx';

// Top tab bar (Main / Seta). The active pill uses a shared layoutId so Framer
// Motion animates it smoothly between tabs — the matchedGeometryEffect analog.
export default function TabBar() {
  const route = useRouter((s) => s.route);
  const goTo = useRouter((s) => s.goTo);

  return (
    <header className="tabbar">
      <div className="tabbar__inner container">
        <button
          className="tabbar__brand"
          onClick={() => goTo('MAIN')}
          aria-label="Seta — home"
        >
          <Logo />
        </button>

        <nav className="tabbar__nav" aria-label="Primary">
          {DESTINATIONS.map((d) => {
            const active = d.id === route;
            return (
              <button
                key={d.id}
                className={`tab ${active ? 'is-active' : ''}`}
                onClick={() => goTo(d.id)}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="tab__pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="tab__idx">{d.index}</span>
                <span className="tab__label">{d.label}</span>
              </button>
            );
          })}
        </nav>

        {/* right-side spacer keeps the tab group visually centred */}
        <span className="tabbar__spacer" aria-hidden="true" />
      </div>
    </header>
  );
}
