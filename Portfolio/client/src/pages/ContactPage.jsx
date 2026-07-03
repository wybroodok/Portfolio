import { motion } from 'framer-motion';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { SocialLink } from '../components/SocialLink.jsx';
import { Loader } from '../components/Loader.jsx';

export function ContactPage() {
  const { data: profile, loading } = useAsync(() => api.getProfile(), []);

  if (loading) {
    return (
      <div className="container">
        <Loader label="Loading profile" />
      </div>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="container contact">
      <div className="contact__grid">
        <section className="contact__profile">
          <motion.div
            className="avatar"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="avatar__initials">{initials}</span>
            {profile.available && <span className="avatar__badge" title="Available" />}
          </motion.div>

          <motion.h1
            className="contact__name"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            {profile.name}
          </motion.h1>
          <motion.p
            className="contact__role"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            {profile.role}
          </motion.p>

          <motion.p
            className="contact__tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {profile.tagline}
          </motion.p>

          <div className="contact__bio">
            {profile.bio.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.28 + i * 0.08 }}
              >
                {para}
              </motion.p>
            ))}
          </div>

          <motion.div
            className="contact__meta mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {profile.location}
          </motion.div>
        </section>

        <section className="contact__links" aria-label="Social links">
          <span className="contact__links-label mono">Elsewhere</span>
          {profile.socials.map((social, i) => (
            <SocialLink key={social.id} social={social} index={i} />
          ))}
        </section>
      </div>
    </div>
  );
}
