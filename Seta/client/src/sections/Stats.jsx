import Reveal from '../components/Reveal.jsx';
import { STATS } from '../data/content.js';

// Quiet numbers strip — restraint expressed as data.
export default function Stats() {
  return (
    <section className="stats container">
      <div className="stats__grid">
        {STATS.map((s, i) => (
          <Reveal key={s.label} className="stat" delay={i * 0.06}>
            <span className="stat__value serif">{s.value}</span>
            <span className="stat__label">{s.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
