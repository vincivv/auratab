/**
 * Single source of truth for grid math. See CLAUDE.md "Locked-in decisions".
 *
 * Widgets live on a discrete cell grid (position: {col,row}, size: {w,h} in
 * whole cells) rather than free pixels — a deliberate pivot from the
 * original soft-snap-to-8px-grid approach, per explicit user direction. See
 * MILESTONES.md 2026-07-29 for the full rationale.
 */
/** Size of one grid cell in pixels. Widget sizes/positions are expressed in whole cells, converted to px at the render boundary (App.tsx). */
export const DOT_SIZE = 80

export function pxToCell(px: number): number {
  return Math.round(px / DOT_SIZE)
}

export function cellToPx(cell: number): number {
  return cell * DOT_SIZE
}

/** How many columns/rows the current viewport fits — the grid's outer bounds. */
export function getGridDimensions(viewportWidth: number, viewportHeight: number): { columns: number; rows: number } {
  return {
    columns: Math.max(1, Math.floor(viewportWidth / DOT_SIZE)),
    rows: Math.max(1, Math.floor(viewportHeight / DOT_SIZE)),
  }
}
