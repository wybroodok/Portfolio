import { motion } from 'framer-motion';
import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { Loader } from './Loader.jsx';

function Stars({ rating = 5 }) {
  return (
    <div className="stars" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`star ${i < rating ? 'star--on' : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
}

/**
 * Testimonials block for the Main page — a centered "Reviews" label above a
 * two-column grid of quote cards. Matches the project-card surface styling.
 */
export function Testimonials() {
  const { data: reviews, loading } = useAsync(() => api.getReviews(), []);

  if (loading) return <Loader label="Loading reviews" />;
  if (!reviews?.length) return null;

  return (
    <section className="reviews">
      <div className="reviews__label-wrap">
        <span className="reviews__label mono">Reviews</span>
      </div>

      <div className="reviews__grid">
        {reviews.map((review, i) => (
          <motion.article
            key={review.id}
            className="review"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Stars rating={review.rating} />
            <p className="review__quote">«{review.quote}»</p>
            {review.author && <span className="review__author mono">{review.author}</span>}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
