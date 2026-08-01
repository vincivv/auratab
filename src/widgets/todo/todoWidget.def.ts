import { TodoWidget } from './TodoWidget'
import type { WidgetDefinition } from '../types'

export const todoWidgetDef: WidgetDefinition<{ items?: { id: string; text: string; done: boolean }[] }> = {
  type: 'todo',
  displayName: 'To-Do List',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 },
  defaultData: {},
  Component: TodoWidget,
}
