/**
 * Single source of truth for grid math. See CLAUDE.md "Locked-in decisions" —
 * spec left the exact grid unit and snap threshold unspecified (FR-9).
 */
export const GRID_UNIT = 8
export const SNAP_THRESHOLD = 14

export const DEFAULT_WIDGET_SIZE = { w: GRID_UNIT * 20, h: GRID_UNIT * 20 }
export const MIN_WIDGET_SIZE = { w: GRID_UNIT * 10, h: GRID_UNIT * 10 }
export const MAX_WIDGET_SIZE = { w: GRID_UNIT * 60, h: GRID_UNIT * 60 }
