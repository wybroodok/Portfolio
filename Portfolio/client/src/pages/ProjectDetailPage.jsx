import { motion } from 'framer-motion';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useRouter } from '../router/RouterContext.jsx';
import { Route } from '../router/routes.js';
import { Loader } from '../components/Loader.jsx';
import { heroBackground } from '../lib/heroStyle.js';

export function ProjectDetailPage({ id }) {
  const { navigate } = useRouter();
  const { data: project, loading, error } = useAsync(() => api.getProject(id), [id]);

  if (loading) {
    return (
      <div className="container">
        <BackLink onClick={() => navigate(Route.ALL_PRODUCTS)} />
        <Loader label="Loading project" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container detail-missing">
        <BackLink onClick={() => navigate(Route.ALL_PRODUCTS)} />
        <h1>Project not found</h1>
        <p className="detail-missing__text">
          This case may have been moved. Head back to the archive.
        </p>
      </div>
    );
  }

  const accent = project.accent || 'var(--accent)';

  return (
    <div className="container detail">
      <BackLink onClick={() => navigate(Route.ALL_PRODUCTS)} />

      {/* Shared element: animates in from the clicked card's hero. */}
      <motion.div
        layoutId={`hero-${project.id}`}
        className="detail__hero"
        style={{ background: heroBackground(accent, project.cover) }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      >
        <span
          className="detail__hero-glow"
          style={{ background: `radial-gradient(80% 120% at 15% 0%, ${accent}2e, transparent 60%)` }}
        />
        <span
          className="detail__hero-monogram"
          style={{ color: accent }}
          aria-hidden="true"
        >
          {project.title?.charAt(0)}
        </span>
        <span
          className="detail__hero-edge"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
        <span className="detail__hero-title" style={{ color: accent }}>
          {project.title}
        </span>
      </motion.div>

      <motion.div
        className="detail__body"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="detail__head">
          <div>
            <span className="detail__year mono">{project.year}</span>
            <h1 className="detail__title">{project.title}</h1>
            <p className="detail__subtitle">{project.subtitle}</p>
          </div>
          <a
            className="btn btn--primary"
            href={project.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            Visit project ↗
          </a>
        </div>

        <div className="detail__tags">
          {project.tags?.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>

        <p className="detail__desc">{project.description}</p>

        <div className="detail__facts">
          <Fact label="Role" value={project.role} />
          {project.metrics?.map((m) => (
            <Fact key={m.label} label={m.label} value={m.value} accent={accent} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Fact({ label, value, accent }) {
  return (
    <div className="fact">
      <span className="fact__value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
      <span className="fact__label mono">{label}</span>
    </div>
  );
}

function BackLink({ onClick }) {
  return (
    <motion.button
      className="backlink"
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -3 }}
    >
      ← Back to archive
    </motion.button>
  );
}
