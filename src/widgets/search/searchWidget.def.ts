import { SearchWidget } from './SearchWidget'
import type { WidgetDefinition } from '../types'
import { GRID_UNIT } from '../../canvas/gridConfig'

export const searchWidgetDef: WidgetDefinition = {
  type: 'search',
  displayName: 'Search bar',
  defaultSize: { w: GRID_UNIT * 30, h: GRID_UNIT * 8 },
  minSize: { w: GRID_UNIT * 18, h: GRID_UNIT * 7 },
  maxSize: { w: GRID_UNIT * 60, h: GRID_UNIT * 10 },
  defaultData: {},
  Component: SearchWidget,
}
