// Brand logo — an abstract "aperture" emblem (a diamond bisected by an accent
// thread, with a bright node at its core) paired with a wide-tracked wordmark.
// Reads as a lens / a fold of fabric / an open eye — quiet and premium.
export default function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <svg
        className="logo__mark"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M14 1.5 L26.5 14 L14 26.5 L1.5 14 Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M14 1.5 V26.5" stroke="var(--accent)" strokeWidth="1.3" />
        <circle cx="14" cy="14" r="2.6" fill="var(--accent)" />
      </svg>
      <span className="logo__word">SETA</span>
    </span>
  );
}
