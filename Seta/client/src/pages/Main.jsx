import XRayHero from '../sections/XRayHero.jsx';
import Slogans from '../sections/Slogans.jsx';
import Stats from '../sections/Stats.jsx';
import Gallery from '../sections/Gallery.jsx';
import { useRouter } from '../store/useRouter.js';

// MAIN destination — the collection experience.
export default function Main() {
  const goTo = useRouter((s) => s.goTo);
  return (
    <div className="main-page">
      <XRayHero />
      <Slogans />
      <Stats />
      <Gallery />

      <section className="cta-band container">
        <p className="eyebrow">Next</p>
        <h2 className="section-title serif">Meet the house behind the black.</h2>
        <button className="btn btn--ghost" onClick={() => goTo('SETA')}>
          Enter Seta <span aria-hidden>→</span>
        </button>
      </section>
    </div>
  );
}
