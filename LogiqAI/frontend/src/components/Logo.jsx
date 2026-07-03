/** Minimal flat logomark — ascending analytic bars. No gradient, no glow. */
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="LogiqAI">
      <rect width="24" height="24" rx="6" fill="var(--panel-2)" stroke="var(--line)" />
      <g fill="var(--accent)">
        <rect x="6" y="13" width="3" height="5" rx="1" />
        <rect x="10.5" y="9" width="3" height="9" rx="1" />
        <rect x="15" y="6" width="3" height="12" rx="1" />
      </g>
    </svg>
  );
}
