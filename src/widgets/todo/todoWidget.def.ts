import { TodoWidget } from './TodoWidget'
import type { WidgetDefinition } from '../types'
import { GRID_UNIT } from '../../canvas/gridConfig'

export const todoWidgetDef: WidgetDefinition<{ items?: { id: string; text: string; done: boolean }[] }> = {
  type: 'todo',
  displayName: 'To-Do List',
  defaultSize: { w: GRID_UNIT * 22, h: GRID_UNIT * 24 },
  minSize: { w: GRID_UNIT * 14, h: GRID_UNIT * 14 },
  maxSize: { w: GRID_UNIT * 50, h: GRID_UNIT * 50 },
  defaultData: {},
  Component: TodoWidget,
}
