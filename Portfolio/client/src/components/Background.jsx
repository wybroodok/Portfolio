import { motion } from 'framer-motion';

/**
 * Ambient background: a barely-there radial glow and a fine grid that give the
 * deep-black canvas depth without ever competing with the content.
 */
export function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg__grid" />
      <motion.div
        className="bg__glow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      <div className="bg__vignette" />
    </div>
  );
}
