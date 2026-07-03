import { motion } from 'framer-motion';
import { useRouter } from '../router/RouterContext.jsx';
import { heroBackground } from '../lib/heroStyle.js';

/**
 * Interactive project preview. The visual "hero" carries a shared `layoutId`
 * so that clicking the card animates that surface seamlessly into the detail
 * page hero (matchedGeometryEffect-style continuity).
 *
 * `variant="feature"` is the large Main-page treatment; `variant="row"` is the
 * compact All-products listing with a dull-gray description.
 */
export function ProjectCard({ project, index = 0, variant = 'feature' }) {
  const { goToProject } = useRouter();
  const accent = project.accent || 'var(--accent)';

  return (
    <motion.article
      className={`card card--${variant}`}
      onClick={() => goToProject(project.id)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToProject(project.id);
        }
      }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      whileTap={{ scale: 0.99 }}
    >
      <motion.div
        layoutId={`hero-${project.id}`}
        className="card__hero"
        style={{ background: heroBackground(accent, project.cover) }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      >
        <span
          className="card__monogram"
          style={{ color: accent }}
          aria-hidden="true"
        >
          {project.title?.charAt(0)}
        </span>
        <motion.span
          className="card__sheen"
          style={{ background: `radial-gradient(120% 120% at 20% 0%, ${accent}33, transparent 60%)` }}
          variants={{ hover: { opacity: 1 }, initial: { opacity: 0 } }}
          initial="initial"
        />
        <span
          className="card__edge"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
        <span className="card__index mono" style={{ color: accent }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <motion.span
          className="card__arrow"
          variants={{ hover: { x: 4, opacity: 1 } }}
          initial={{ opacity: 0.55 }}
          style={{ color: accent }}
        >
          ↗
        </motion.span>
      </motion.div>

      <div className="card__body">
        <div className="card__head">
          <h3 className="card__title">{project.title}</h3>
          <span className="card__year mono">{project.year}</span>
        </div>
        <p className="card__subtitle">{project.subtitle}</p>

        {variant === 'row' && (
          <p className="card__desc">{project.summary}</p>
        )}

        <div className="card__tags">
          {project.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
