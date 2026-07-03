import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  animate,
} from 'framer-motion';
import SmartImage from '../components/SmartImage.jsx';
import { HERO } from '../data/content.js';

// The x-ray hero. The SAME shot is stacked twice: the default look on top, an
// alternate colourway underneath. A soft lens follows the cursor and punches a
// hole through the top layer with a CSS mask — so wherever you point, the same
// figure in the same pose appears re-dressed in another Seta look.
//
// Motion details that make it feel right:
//  - On enter we `jump()` the position to the cursor so the lens never flies in
//    from off-screen; it simply appears exactly where the pointer is.
//  - The lens OPENS and CLOSES by animating its radius in place, so leaving the
//    image shrinks the hole smoothly instead of yanking it away.
const LENS = 150; // max lens radius in px

export default function XRayHero() {
  const wrapRef = useRef(null);
  const activeRef = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 350, damping: 36, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 350, damping: 36, mass: 0.35 });

  // Radius drives the mask hole. 0 = fully closed (top layer intact).
  const r = useMotionValue(0);

  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${sx}px ${sy}px, #0000 0%, #0000 70%, #000 100%)`;

  const localPos = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { nx: e.clientX - rect.left, ny: e.clientY - rect.top };
  };

  const open = (nx, ny) => {
    // Teleport position (no spring fly-in), then grow the lens in place.
    x.jump(nx);
    y.jump(ny);
    sx.jump(nx);
    sy.jump(ny);
    activeRef.current = true;
    animate(r, LENS, { duration: 0.35, ease: [0.22, 1, 0.36, 1] });
  };

  const handleMove = (e) => {
    const p = localPos(e);
    if (!p) return;
    if (!activeRef.current) {
      open(p.nx, p.ny);
      return;
    }
    // Follow the cursor smoothly — the spring handles the easing.
    x.set(p.nx);
    y.set(p.ny);
  };

  const handleLeave = () => {
    activeRef.current = false;
    // Close the hole where it is — no position jerk on the way out.
    animate(r, 0, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
  };

  return (
    <section className="hero">
      <div className="hero__grid container">
        <div className="hero__copy">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Autumn / Winter — Vol. 02
          </motion.p>

          <motion.h1
            className="hero__title serif"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            Wear your
            <span className="hero__title-accent"> freedom.</span>
          </motion.h1>

          <motion.p
            className="hero__lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.8 }}
          >
            Move your cursor across him. The same man, the same stance —
            re-dressed in an alternate Seta look wherever you point. One
            silhouette, endless ways to disappear into comfort.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
          >
            <a className="btn btn--primary" href="#collection">
              Explore the collection
            </a>
            <span className="hero__hint">
              <span className="hero__hint-dot" /> hover the figure
            </span>
          </motion.div>
        </div>

        <motion.div
          ref={wrapRef}
          className="hero__stage"
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* underneath: the look the x-ray uncovers (grey coat) */}
          <div className="hero__layer hero__layer--reveal">
            <SmartImage
              src={HERO.reveal}
              alt="Model in the revealed Seta look"
              loading="eager"
            />
          </div>

          {/* on top: the default look (black jacket), masked around the cursor */}
          <motion.div
            className="hero__layer hero__layer--base"
            style={{ WebkitMaskImage: mask, maskImage: mask }}
          >
            <SmartImage
              src={HERO.base}
              alt="Model in the default Seta look"
              loading="eager"
              fetchpriority="high"
            />
          </motion.div>
        </motion.div>
      </div>

      <div className="hero__marquee" aria-hidden="true">
        <div className="hero__marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              Comfort · Freedom · Restraint · Deep Black · Made to be forgotten ·
              Comfort · Freedom · Restraint · Deep Black · Made to be forgotten ·
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
