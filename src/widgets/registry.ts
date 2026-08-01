import { clockWidgetDef } from './clock/clockWidget.def'
import { searchWidgetDef } from './search/searchWidget.def'
import { linksWidgetDef } from './links/linksWidget.def'
import { notesWidgetDef } from './notes/notesWidget.def'
import { todoWidgetDef } from './todo/todoWidget.def'
import { weatherWidgetDef } from './weather/weatherWidget.def'
import type { WidgetDefinition } from './types'

export const widgetRegistry: WidgetDefinition<any>[] = [
  clockWidgetDef,
  searchWidgetDef,
  linksWidgetDef,
  notesWidgetDef,
  todoWidgetDef,
  weatherWidgetDef,
]

export function getWidgetDefinition(type: string): WidgetDefinition<any> | undefined {
  return widgetRegistry.find((def) => def.type === type)
}
