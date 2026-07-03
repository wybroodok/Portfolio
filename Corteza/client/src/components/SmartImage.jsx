import { useState } from 'react';

/**
 * Image with an elegant tonal fallback. If a remote asset fails to load,
 * a soft accent-tinted gradient render takes its place — so the layout never
 * breaks and the premium feel is preserved offline.
 */
export default function SmartImage({ src, alt, accent = '#E2622E', className = '', label }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`smart-img smart-img--fallback ${className}`}
        style={{
          background: `radial-gradient(120% 90% at 30% 20%, ${accent}33, transparent 55%),
                       radial-gradient(90% 80% at 85% 90%, ${accent}22, transparent 60%),
                       linear-gradient(160deg, #161615, #0c0c0b)`,
        }}
        role="img"
        aria-label={alt}
      >
        {label && <span className="smart-img__label display">{label}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`smart-img ${loaded ? 'is-loaded' : ''} ${className}`}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
