import { useState } from 'react';

// Image with a graceful, on-brand fallback. If the remote photo fails to load
// we swap to a dark gradient placeholder so the composition never collapses.
export default function SmartImage({ src, alt = '', className = '', style, ...rest }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={`smart-image smart-image--fallback ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        <span>SETA</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`smart-image ${loaded ? 'is-loaded' : ''} ${className}`}
      style={style}
      {...rest}
    />
  );
}
