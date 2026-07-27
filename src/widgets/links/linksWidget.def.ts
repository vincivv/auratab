import { LinksWidget } from './LinksWidget'
import type { WidgetDefinition } from '../types'
import { GRID_UNIT } from '../../canvas/gridConfig'

export const linksWidgetDef: WidgetDefinition<{ links?: { id: string; label: string; url: string }[] }> = {
  type: 'links',
  displayName: 'Quick Links',
  defaultSize: { w: GRID_UNIT * 24, h: GRID_UNIT * 20 },
  minSize: { w: GRID_UNIT * 16, h: GRID_UNIT * 14 },
  maxSize: { w: GRID_UNIT * 50, h: GRID_UNIT * 50 },
  defaultData: {},
  Component: LinksWidget,
}
