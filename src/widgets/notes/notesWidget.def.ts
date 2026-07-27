import { NotesWidget } from './NotesWidget'
import type { WidgetDefinition } from '../types'
import { GRID_UNIT } from '../../canvas/gridConfig'

export const notesWidgetDef: WidgetDefinition<{ text?: string }> = {
  type: 'notes',
  displayName: 'Notes',
  defaultSize: { w: GRID_UNIT * 22, h: GRID_UNIT * 20 },
  minSize: { w: GRID_UNIT * 14, h: GRID_UNIT * 12 },
  maxSize: { w: GRID_UNIT * 50, h: GRID_UNIT * 50 },
  defaultData: {},
  Component: NotesWidget,
}
