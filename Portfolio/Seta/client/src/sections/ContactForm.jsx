import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTACT_EMAIL } from '../data/content.js';

// Collaboration form — posts to the Express /api/contact endpoint.
export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('done');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div className="contact-card">
      <AnimatePresence mode="wait">
        {status === 'done' ? (
          <motion.div
            key="done"
            className="contact-done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="contact-done__mark">✦</span>
            <h3 className="serif">Received.</h3>
            <p>
              Thank you for reaching out. The atelier will reply from{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> shortly.
            </p>
            <button className="btn btn--ghost" onClick={() => setStatus('idle')}>
              Send another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className="contact-form"
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="you@studio.com"
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                required
                rows={4}
                value={form.message}
                onChange={update('message')}
                placeholder="Tell us about the collaboration…"
              />
            </div>

            {status === 'error' && <p className="contact-error">{error}</p>}

            <motion.button
              type="submit"
              className="btn btn--primary contact-submit"
              disabled={status === 'sending'}
              whileTap={{ scale: 0.97 }}
            >
              {status === 'sending' ? 'Sending…' : 'Start the conversation'}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
