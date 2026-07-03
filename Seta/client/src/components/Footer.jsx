import { useRouter } from '../store/useRouter.js';
import { CONTACT_EMAIL } from '../data/content.js';

export default function Footer() {
  const goTo = useRouter((s) => s.goTo);
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <span className="serif footer__mark">SETA</span>
          <p>Wear your freedom.</p>
        </div>
        <nav className="footer__col">
          <span className="footer__label">Navigate</span>
          <button onClick={() => goTo('MAIN')}>Main</button>
          <button onClick={() => goTo('SETA')}>Seta</button>
        </nav>
        <div className="footer__col">
          <span className="footer__label">Contact</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <a href="#collection">Collection</a>
        </div>
        <div className="footer__col">
          <span className="footer__label">Studio</span>
          <span>Milan · Remote</span>
          <span>Mon–Fri, 09—18</span>
        </div>
      </div>
      <div className="footer__base container">
        <span>© {year} Seta Atelier. All rights reserved.</span>
        <span>Deep black · Made to be forgotten</span>
      </div>
    </footer>
  );
}
