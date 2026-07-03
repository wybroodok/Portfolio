import { motion } from 'framer-motion';

// Intro loader — a thin accent line draws itself under the wordmark, then the
// whole overlay lifts away to reveal the site.
export default function Loader() {
  return (
    <motion.div
      className="loader"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="loader__inner">
        <motion.span
          className="loader__mark serif"
          initial={{ opacity: 0, letterSpacing: '0.8em' }}
          animate={{ opacity: 1, letterSpacing: '0.35em' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          SETA
        </motion.span>
        <div className="loader__track">
          <motion.div
            className="loader__bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </div>
        <motion.span
          className="loader__tag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Wear your freedom
        </motion.span>
      </div>
    </motion.div>
  );
}
