import { ClockWidget } from './ClockWidget'
import type { WidgetDefinition } from '../types'
import { GRID_UNIT } from '../../canvas/gridConfig'

export const clockWidgetDef: WidgetDefinition = {
  type: 'clock',
  displayName: 'Clock',
  defaultSize: { w: GRID_UNIT * 20, h: GRID_UNIT * 14 },
  minSize: { w: GRID_UNIT * 12, h: GRID_UNIT * 10 },
  maxSize: { w: GRID_UNIT * 40, h: GRID_UNIT * 24 },
  defaultData: {},
  Component: ClockWidget,
}
