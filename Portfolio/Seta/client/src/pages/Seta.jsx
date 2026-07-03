import { motion } from 'framer-motion';
import Reveal from '../components/Reveal.jsx';
import ContactForm from '../sections/ContactForm.jsx';
import { STORY, MATERIALS, CONTACT_EMAIL } from '../data/content.js';

// SETA destination — the house, its story, materials and contact.
export default function Seta() {
  return (
    <div className="seta-page">
      <section className="seta-hero container">
        <Reveal className="seta-hero__inner">
          <p className="eyebrow">The house</p>
          <h1 className="seta-hero__title serif">
            Seta is the discipline <br /> of taking things away.
          </h1>
          <p className="seta-hero__lead">
            Founded in a single atelier, Seta makes fewer things, more slowly.
            We chase the feeling a garment gives when you forget you are wearing
            it — the quiet freedom of comfort without compromise.
          </p>
        </Reveal>
      </section>

      <section className="story container">
        <div className="story__line" aria-hidden />
        {STORY.map((s, i) => (
          <Reveal key={s.year} className="story__item" delay={i * 0.05}>
            <span className="story__year serif">{s.year}</span>
            <div className="story__body">
              <h3 className="serif">{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="materials container">
        <Reveal>
          <p className="eyebrow">The materials</p>
          <h2 className="section-title serif">Honest fibres only.</h2>
        </Reveal>
        <ul className="materials__list">
          {MATERIALS.map((m, i) => (
            <Reveal as="li" key={m} className="materials__item" delay={i * 0.05}>
              <span className="materials__dot" />
              {m}
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="contact container" id="contact">
        <div className="contact__grid">
          <Reveal className="contact__intro">
            <p className="eyebrow">Collaborate</p>
            <h2 className="section-title serif">
              For stockists, press <br /> & creative partners.
            </h2>
            <p className="contact__note">
              We work with a small number of partners each year. Tell us what
              you have in mind, or write to us directly.
            </p>
            <motion.a
              className="contact__email serif"
              href={`mailto:${CONTACT_EMAIL}`}
              whileHover={{ x: 6 }}
            >
              {CONTACT_EMAIL} <span aria-hidden>→</span>
            </motion.a>
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
