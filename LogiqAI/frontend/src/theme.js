/**
 * Design tokens for JS-side consumers (Recharts, inline styles).
 * Refined, muted palette — no neon. A single warm accent carries the brand;
 * charts use a calm, distinct-hue categorical set. Assigned in FIXED order.
 */
export const PALETTE = {
  ink1: "#e7e8ea",
  ink2: "#9aa1ac",
  ink3: "#666d78",
  grid: "rgba(255,255,255,0.05)",
  axis: "rgba(154,161,172,0.4)",
  surface: "#161a1f",

  accent: "#c8a253", // muted gold — brand accent

  // Muted categorical hues (legible on the dark neutral surface).
  teal: "#5fa8a0",
  clay: "#c47f56",
  peri: "#8390cc",
  sage: "#9aae6e",
  gold: "#c8a253",
  mauve: "#b07a9c",
};

/** Fixed categorical order for donut / category encodings. */
export const CATEGORICAL = [
  PALETTE.teal,
  PALETTE.clay,
  PALETTE.peri,
  PALETTE.sage,
  PALETTE.gold,
  PALETTE.mauve,
];

export const PRIORITY = {
  critical: { color: "#cf6a63", label: "Critical", icon: "!" },
  important: { color: "#c8a253", label: "Important", icon: "◆" },
  tip: { color: "#6fae8f", label: "Tips", icon: "✓" },
};
