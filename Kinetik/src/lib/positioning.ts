/**
 * Fractional indexing for Kanban ordering.
 *
 * Each card stores a floating-point `position`. To move a card between two
 * neighbours we set its position to the midpoint of theirs — so a reorder
 * updates a SINGLE row instead of renumbering the whole column.
 *
 *   [1.0]  [2.0]  [3.0]     drop between 1.0 and 2.0  ->  new position 1.5
 *
 * Floats eventually run out of precision if you keep splitting the same gap.
 * `needsRebalance` detects that so the caller can renumber the column lazily.
 */

/** Gap between cards when a column is first laid out / a card is appended. */
export const POSITION_STEP = 1024;

/**
 * Compute a position strictly between `prev` and `next`.
 * Pass `null` for an open end (top or bottom of the column).
 *
 *  - top of column:    getPositionBetween(null, firstCard.position)
 *  - bottom of column: getPositionBetween(lastCard.position, null)
 *  - empty column:     getPositionBetween(null, null) -> POSITION_STEP
 */
export function getPositionBetween(
  prev: number | null,
  next: number | null,
): number {
  if (prev == null && next == null) return POSITION_STEP;
  if (prev == null) return (next as number) - POSITION_STEP;
  if (next == null) return prev + POSITION_STEP;
  return (prev + next) / 2;
}

/**
 * True when neighbouring positions have collapsed so close that the midpoint
 * can no longer be represented distinctly. Trigger a column rebalance when so.
 */
export function needsRebalance(prev: number | null, next: number | null): boolean {
  if (prev == null || next == null) return false;
  return Math.abs(next - prev) < 1e-6;
}

/** Evenly spaced positions for renumbering an ordered column (rebalance). */
export function rebalancedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_STEP);
}
