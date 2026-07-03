import { motion } from 'framer-motion';

/**
 * Minimal spring loader — a single neon arc that breathes. Used while page
 * data resolves so transitions never snap to empty content.
 */
export function Loader({ label = 'Loading' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <motion.span
        className="loader__ring"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      />
      <motion.span
        className="loader__label mono"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      >
        {label}
      </motion.span>
    </div>
  );
}
