import { SearchWidget } from './SearchWidget'
import type { WidgetDefinition } from '../types'

export const searchWidgetDef: WidgetDefinition = {
  type: 'search',
  displayName: 'Search bar',
  defaultSize: { w: 3, h: 1 },
  minSize: { w: 2, h: 1 },
  maxSize: { w: 5, h: 1 },
  chromeless: true,
  defaultData: {},
  Component: SearchWidget,
}
