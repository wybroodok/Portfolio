import { motion } from 'framer-motion';

// Fade + rise as the element scrolls into view. `once` so it settles and stays.
export default function Reveal({ children, delay = 0, y = 28, className = '', as = 'div' }) {
  const MotionTag = motion[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
