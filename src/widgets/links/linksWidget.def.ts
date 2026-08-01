import { LinksWidget } from './LinksWidget'
import type { WidgetDefinition } from '../types'

export const linksWidgetDef: WidgetDefinition<{ links?: { id: string; label: string; url: string }[] }> = {
  type: 'links',
  displayName: 'Quick Links',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 },
  defaultData: {},
  Component: LinksWidget,
}
