import { motion } from 'framer-motion';
import { useRouter } from '../router/RouterContext.jsx';
import { TABS } from '../router/routes.js';

/**
 * Segmented tab navigation. The active "pill" is a single shared element
 * (layoutId) that glides between tabs with a spring — Framer Motion's answer
 * to matchedGeometryEffect.
 */
export function TabBar() {
  const { activeTab, navigate } = useRouter();

  return (
    <nav className="tabbar" role="tablist" aria-label="Primary">
      {TABS.map((tab) => {
        const isActive = tab.route === activeTab;
        return (
          <button
            key={tab.route}
            role="tab"
            aria-selected={isActive}
            className={`tab ${isActive ? 'tab--active' : ''}`}
            onClick={() => navigate(tab.route)}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="tab__pill"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              />
            )}
            <span className="tab__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
