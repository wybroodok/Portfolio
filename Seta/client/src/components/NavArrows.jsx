import { motion } from 'framer-motion';
import { useRouter } from '../store/useRouter.js';
import { DESTINATIONS, routeIndex } from '../router/routes.js';

// The small side arrows requested in the brief. They walk the ordered
// DESTINATIONS list through the centralized router. Each arrow previews the
// destination it leads to and disables at the ends of the list.
export default function NavArrows() {
  const route = useRouter((s) => s.route);
  const next = useRouter((s) => s.next);
  const prev = useRouter((s) => s.prev);

  const i = routeIndex(route);
  const prevDest = DESTINATIONS[i - 1];
  const nextDest = DESTINATIONS[i + 1];

  return (
    <>
      <SideArrow side="left" dest={prevDest} onClick={prev} />
      <SideArrow side="right" dest={nextDest} onClick={next} />
    </>
  );
}

function SideArrow({ side, dest, onClick }) {
  const disabled = !dest;
  return (
    <div className={`nav-arrow nav-arrow--${side}`} aria-hidden={disabled}>
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="nav-arrow__btn"
        aria-label={dest ? `Go to ${dest.label}` : undefined}
        whileHover={disabled ? undefined : { scale: 1.08 }}
        whileTap={disabled ? undefined : { scale: 0.92 }}
        initial={{ opacity: 0, x: side === 'left' ? -12 : 12 }}
        animate={{ opacity: disabled ? 0 : 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="nav-arrow__glyph">{side === 'left' ? '‹' : '›'}</span>
        {dest && (
          <span className="nav-arrow__meta">
            <span className="nav-arrow__idx">{dest.index}</span>
            <span className="nav-arrow__label">{dest.label}</span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
