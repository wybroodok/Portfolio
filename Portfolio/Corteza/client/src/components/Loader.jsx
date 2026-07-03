import { motion } from 'framer-motion';

/** Deliberate, editorial opening — the maison introduces itself. */
export default function Loader() {
  return (
    <motion.div
      className="loader"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="loader__center">
        <motion.p
          className="eyebrow loader__eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          Firenze · MCMXXIV
        </motion.p>

        <div className="loader__word" aria-label="Corteza">
          {'CORTEZA'.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="display loader__char"
              initial={{ opacity: 0, y: '55%' }}
              animate={{ opacity: 1, y: '0%' }}
              transition={{
                delay: 0.25 + i * 0.055,
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        <div className="loader__line">
          <motion.span
            className="loader__line-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}
