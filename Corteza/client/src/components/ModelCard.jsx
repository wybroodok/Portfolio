import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useRouter } from '../store/useRouter.js';
import SmartImage from './SmartImage.jsx';

/**
 * A single model, revealed on scroll with its name alongside.
 * The image carries a `layoutId` so it flies into place on the detail view
 * (Framer Motion's answer to matchedGeometryEffect).
 */
export default function ModelCard({ model, i }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px -12% 0px' });
  const openProduct = useRouter((s) => s.openProduct);
  const flip = i % 2 === 1; // alternate the rhythm down the page

  return (
    <article ref={ref} className={`model ${flip ? 'model--flip' : ''}`}>
      <motion.button
        className="model__frame"
        onClick={() => openProduct(model.id)}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        whileHover="hover"
      >
        <motion.div
          className="model__media"
          variants={{ hover: { scale: 1.03 } }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div layoutId={`media-${model.id}`} className="model__media-inner">
            <SmartImage
              src={model.image}
              alt={`Corteza ${model.name}`}
              accent={model.accent}
              label={model.name}
            />
          </motion.div>
          <span
            className="model__wash"
            style={{ '--wash': model.accent }}
            aria-hidden
          />
        </motion.div>

        <motion.span
          className="model__cta eyebrow"
          variants={{ hover: { opacity: 1, x: 0 } }}
          initial={{ opacity: 0, x: -6 }}
        >
          Scopri →
        </motion.span>
      </motion.button>

      <div className="model__caption">
        <motion.span
          className="mono-index"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.8 }}
        >
          {model.index}
        </motion.span>

        <motion.h3
          className="model__name display"
          layoutId={`name-${model.id}`}
        >
          {model.name}
        </motion.h3>

        <motion.p
          className="model__tagline"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {model.tagline}
        </motion.p>

        <motion.div
          className="model__meta"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.25, duration: 0.9 }}
        >
          <span>{model.silhouette}</span>
          <span className="model__price">€{model.price}</span>
        </motion.div>
      </div>
    </article>
  );
}
