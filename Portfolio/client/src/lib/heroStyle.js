/**
 * Builds a branded, per-project hero background so every preview reads in its
 * own brand color at rest (not only on hover). Layers a soft accent wash from
 * the top-left and a fainter one bottom-right over the project's `cover` tone,
 * fading into near-black so the deep-mode aesthetic is preserved.
 *
 * The 2-digit hex suffixes (e.g. `28`) are alpha values on the accent color.
 */
export function heroBackground(accent, cover) {
  const base = cover || '#0d0d0d';
  return [
    `radial-gradient(120% 130% at 12% 0%, ${accent}2b 0%, ${accent}12 26%, transparent 55%)`,
    `radial-gradient(90% 120% at 100% 100%, ${accent}18 0%, transparent 55%)`,
    `linear-gradient(155deg, ${base} 0%, #070707 128%)`,
  ].join(', ');
}
