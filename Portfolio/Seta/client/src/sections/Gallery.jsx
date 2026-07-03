import { motion } from 'framer-motion';
import Reveal from '../components/Reveal.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { GALLERY } from '../data/content.js';

// Static editorial gallery of dark-tone menswear.
export default function Gallery() {
  return (
    <section className="gallery container" id="collection">
      <Reveal className="gallery__head">
        <p className="eyebrow">The collection</p>
        <h2 className="section-title serif">Worn in shadow.</h2>
        <p className="gallery__intro">
          A wardrobe cut from deep blacks and honest fibres. No season shouts;
          every piece is built to outlive the trend that inspired it.
        </p>
      </Reveal>

      <div className="gallery__grid">
        {GALLERY.map((item, i) => (
          <motion.figure
            key={item.src}
            className={`gallery__item ${item.tall ? 'is-tall' : ''}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
          >
            <div className="gallery__frame">
              <SmartImage src={item.src} alt={item.alt} />
              <span className="gallery__tag">{item.tag}</span>
            </div>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
