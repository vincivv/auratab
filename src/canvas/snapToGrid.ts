import { GRID_UNIT, SNAP_THRESHOLD } from './gridConfig'

function snapValue(value: number): number {
  const nearest = Math.round(value / GRID_UNIT) * GRID_UNIT
  return Math.abs(nearest - value) <= SNAP_THRESHOLD ? nearest : value
}

/** Soft-snaps a released position to the nearest grid cell if within threshold (FR-9). */
export function snapToGrid(x: number, y: number): { x: number; y: number } {
  return { x: snapValue(x), y: snapValue(y) }
}
