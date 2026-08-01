import { ClockWidget } from './ClockWidget'
import type { WidgetDefinition } from '../types'

// Short/wide, not square — a 2-line time+date display doesn't need a tall
// box. Free-resize via the corner handle like any other widget (see
// MILESTONES.md 2026-07-30 — tap-to-cycle presets were tried and replaced
// with this per user request).
export const clockWidgetDef: WidgetDefinition = {
  type: 'clock',
  displayName: 'Clock',
  defaultSize: { w: 2, h: 1 },
  minSize: { w: 2, h: 1 },
  maxSize: { w: 3, h: 2 },
  chromeless: true,
  defaultData: {},
  Component: ClockWidget,
}
