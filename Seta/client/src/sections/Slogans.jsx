import Reveal from '../components/Reveal.jsx';
import { SLOGANS } from '../data/content.js';

// Editorial slogan blocks — comfort / freedom / restraint.
export default function Slogans() {
  return (
    <section className="slogans container" id="ethos">
      <Reveal className="slogans__head">
        <p className="eyebrow">The philosophy</p>
        <h2 className="section-title serif">
          Clothing you feel, <br /> not clothing you notice.
        </h2>
      </Reveal>

      <div className="slogans__grid">
        {SLOGANS.map((s, i) => (
          <Reveal key={s.kicker} className="slogan" delay={i * 0.08}>
            <span className="slogan__num">{String(i + 1).padStart(2, '0')}</span>
            <p className="slogan__kicker">{s.kicker}</p>
            <h3 className="slogan__title serif">{s.title}</h3>
            <p className="slogan__body">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
