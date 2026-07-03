import { motion } from 'framer-motion';

const CHAPTERS = [
  {
    n: 'I',
    title: 'L’origine',
    text: 'Nel 1924, in una bottega di Oltrarno, il primo paio di Corteza fu limato a mano da un unico blocco di acetato. Un secolo dopo, ogni montatura nasce ancora dallo stesso gesto.',
  },
  {
    n: 'II',
    title: 'La materia',
    text: 'Acetato Mazzucchelli, titanio, cristallo minerale. Materiali scelti per invecchiare con grazia — e per durare più di una moda.',
  },
  {
    n: 'III',
    title: 'La luce',
    text: 'Ogni lente è tarata sulla luce del Mediterraneo: calda, obliqua, generosa. Vedere bene è un atto di piacere, non di necessità.',
  },
];

/** The house — a quiet, editorial story. */
export default function Maison({ data }) {
  const { maison } = data;
  return (
    <div className="maison">
      <section className="maison__hero">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          {maison.origin} · {maison.est}
        </motion.p>
        <motion.h1
          className="display maison__statement"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          Un secolo di sguardi,
          <br />
          <span className="accent-text">forgiati a mano.</span>
        </motion.h1>
        <motion.p
          className="maison__lede"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          {maison.manifestoEn}
        </motion.p>
      </section>

      <section className="chapters">
        {CHAPTERS.map((c, i) => (
          <motion.article
            key={c.n}
            className="chapter"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="chapter__n display">{c.n}</span>
            <div className="chapter__body">
              <h2 className="chapter__title display">{c.title}</h2>
              <p className="chapter__text">{c.text}</p>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="maison__signature">
        <p className="display">“La misura di uno sguardo è la misura di un uomo.”</p>
        <span className="eyebrow">— Il fondatore, 1924</span>
      </section>
    </div>
  );
}
