import { NotesWidget } from './NotesWidget'
import type { WidgetDefinition } from '../types'

interface Note {
  id: string
  title: string
  text: string
  updatedAt: number
}

export const notesWidgetDef: WidgetDefinition<{ notes?: Note[]; text?: string }> = {
  type: 'notes',
  displayName: 'Notes',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 },
  defaultData: {},
  Component: NotesWidget,
}
