import { motion } from 'framer-motion';

/**
 * A contact link that reads as an editorial list row, not a default button.
 * The whole row lifts, an accent line grows, and the arrow slides on hover.
 */
export function SocialLink({ social, index = 0 }) {
  return (
    <motion.a
      className="social"
      href={social.url}
      target={social.url.startsWith('mailto:') ? undefined : '_blank'}
      rel="noreferrer noopener"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
    >
      <motion.span
        className="social__bar"
        variants={{ hover: { scaleY: 1 } }}
        initial={{ scaleY: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
      <div className="social__main">
        <span className="social__label">{social.label}</span>
        <span className="social__desc">{social.description}</span>
      </div>
      <div className="social__meta">
        <span className="social__handle mono">{social.handle}</span>
        <motion.span
          className="social__arrow"
          variants={{ hover: { x: 5, opacity: 1 } }}
          initial={{ opacity: 0.4 }}
        >
          ↗
        </motion.span>
      </div>
    </motion.a>
  );
}
