import { WeatherWidget } from './WeatherWidget'
import type { WidgetDefinition } from '../types'

export const weatherWidgetDef: WidgetDefinition<{ city?: string }> = {
  type: 'weather',
  displayName: 'Weather',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 4, h: 3 },
  defaultData: {},
  Component: WeatherWidget,
}
