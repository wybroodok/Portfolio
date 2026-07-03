import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from '../store/useRouter.js';
import SmartImage from '../components/SmartImage.jsx';

const stagger = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
});

/**
 * Product detail — layered over the collection. The media & name share a
 * `layoutId` with the originating card, producing a seamless flight into place.
 */
export default function ProductDetail({ model }) {
  const closeProduct = useRouter((s) => s.closeProduct);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeProduct();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [closeProduct]);

  return (
    <motion.div
      className="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        className="detail__scrim"
        onClick={closeProduct}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-label="Chiudi"
      />

      <div className="detail__panel">
        <motion.div className="detail__media">
          <motion.div layoutId={`media-${model.id}`} className="detail__media-inner">
            <SmartImage
              src={model.image}
              alt={`Corteza ${model.name}`}
              accent={model.accent}
              label={model.name}
            />
          </motion.div>
          <span
            className="detail__wash"
            style={{ '--wash': model.accent }}
            aria-hidden
          />
        </motion.div>

        <div className="detail__info">
          <motion.button className="detail__close" onClick={closeProduct} {...stagger(0.1)}>
            ← Torna alla collezione
          </motion.button>

          <motion.span className="mono-index" {...stagger(0.15)}>
            {model.index} · {model.silhouette}
          </motion.span>

          <motion.h2 className="detail__name display" layoutId={`name-${model.id}`}>
            {model.name}
          </motion.h2>

          <motion.p className="detail__tagline" {...stagger(0.2)}>
            {model.tagline}
          </motion.p>

          <motion.p className="detail__story" {...stagger(0.28)}>
            {model.story}
          </motion.p>

          <motion.dl className="detail__specs" {...stagger(0.36)}>
            <div>
              <dt className="eyebrow">Materiale</dt>
              <dd>{model.material}</dd>
            </div>
            <div>
              <dt className="eyebrow">Lente</dt>
              <dd>{model.lens}</dd>
            </div>
          </motion.dl>

          <motion.div className="detail__buy" {...stagger(0.44)}>
            <span className="detail__price display">€{model.price}</span>
            <motion.button
              className="detail__add"
              style={{ '--accent': model.accent }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Aggiungi alla borsa
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
