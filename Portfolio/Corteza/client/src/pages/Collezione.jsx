import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import SmartImage from '../components/SmartImage.jsx';
import ModelCard from '../components/ModelCard.jsx';
import { useRouter } from '../store/useRouter.js';

/** Home — the brand, one model worn, then the collection revealed on scroll. */
export default function Collezione({ data }) {
  const { hero, collection, maison } = data;
  const heroRef = useRef(null);
  const openProduct = useRouter((s) => s.openProduct);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-40%']);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const word = (hero.title || 'Corteza').toUpperCase();

  return (
    <div className="collezione">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__media" style={{ y: imgY }}>
          <SmartImage
            src={hero.imagePortrait || hero.image}
            alt={`Corteza ${hero.model}`}
            accent="#E2622E"
            label={hero.model}
            className="hero__img"
          />
          <span className="hero__vignette" aria-hidden />
        </motion.div>

        <motion.div className="hero__copy" style={{ y: titleY, opacity: heroFade }}>
          <motion.p
            className="eyebrow hero__eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9 }}
          >
            {hero.eyebrow}
          </motion.p>

          <h1 className="hero__title display" aria-label={word}>
            {word.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="hero__char"
                initial={{ opacity: 0, y: '60%' }}
                animate={{ opacity: 1, y: '0%' }}
                transition={{
                  delay: 0.3 + i * 0.05,
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.div
            className="hero__foot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 1 }}
          >
            <button className="hero__worn" onClick={() => openProduct(hero.id)}>
              <em className="display">{hero.model}</em>
              <span className="eyebrow">{hero.tagline} — Scopri il modello →</span>
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__scroll eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 1 }}
        >
          <span>Scorri</span>
          <motion.span
            className="hero__scroll-line"
            animate={{ scaleY: [0.3, 1, 0.3], originY: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      {/* ── Section intro ────────────────────────────────────── */}
      <section className="collection-intro">
        <p className="eyebrow">I Modelli</p>
        <h2 className="display collection-intro__title">
          Sei sguardi, <span className="accent-text">una firma.</span>
        </h2>
        <p className="collection-intro__text">{maison.manifesto}</p>
      </section>

      {/* ── The models, revealed on scroll ───────────────────── */}
      <section className="models">
        {collection.map((model, i) => (
          <ModelCard key={model.id} model={model} i={i} />
        ))}
      </section>

      {/* ── Foot ─────────────────────────────────────────────── */}
      <footer className="foot">
        <p className="foot__mark display">CORTEZA</p>
        <div className="foot__cols">
          <span className="eyebrow">{maison.origin}</span>
          <span className="eyebrow">Est. {maison.est}</span>
          <span className="eyebrow">Fatto a mano</span>
        </div>
        <p className="foot__fine">© {new Date().getFullYear()} Corteza — Maison di Occhiali. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}
