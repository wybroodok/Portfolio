import { motion } from 'framer-motion';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { useRouter } from '../router/RouterContext.jsx';
import { Route } from '../router/routes.js';
import { ProjectCard } from '../components/ProjectCard.jsx';
import { Testimonials } from '../components/Testimonials.jsx';
import { Loader } from '../components/Loader.jsx';

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function MainPage() {
  const { navigate } = useRouter();
  const { data: projects, loading } = useAsync(() => api.getFeaturedProjects(), []);

  return (
    <div className="container">
      <section className="hero">
        <motion.span className="hero__eyebrow mono" variants={fade} initial="hidden" animate="show">
          Product design · Full-stack
        </motion.span>
        <motion.h1 className="hero__title" variants={fade} custom={1} initial="hidden" animate="show">
          Quiet interfaces,
          <br />
          <span className="hero__title-accent">precise craft.</span>
        </motion.h1>
        <motion.p className="hero__lede" variants={fade} custom={2} initial="hidden" animate="show">
          Selected work from a designer-engineer building digital products where
          restraint is the feature.
        </motion.p>
        <motion.div className="hero__actions" variants={fade} custom={3} initial="hidden" animate="show">
          <motion.button
            className="btn btn--primary"
            onClick={() => navigate(Route.ALL_PRODUCTS)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            View all work
          </motion.button>
          <motion.button
            className="btn btn--ghost"
            onClick={() => navigate(Route.CONTACT)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Get in touch
          </motion.button>
        </motion.div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Selected work</h2>
          <button className="section__link" onClick={() => navigate(Route.ALL_PRODUCTS)}>
            All products →
          </button>
        </div>

        {loading ? (
          <Loader label="Loading work" />
        ) : (
          <div className="grid grid--feature">
            {projects?.slice(0, 3).map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} variant="feature" />
            ))}
          </div>
        )}
      </section>

      <Testimonials />
    </div>
  );
}
