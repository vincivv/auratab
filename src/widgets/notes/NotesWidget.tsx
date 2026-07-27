import type { WidgetComponentProps } from '../types'

interface NotesData extends Record<string, unknown> {
  text?: string
}

export function NotesWidget({ data, onDataChange }: WidgetComponentProps<NotesData>) {
  return (
    <textarea
      className="widget widget--notes"
      value={data.text ?? ''}
      onChange={(e) => onDataChange({ ...data, text: e.target.value })}
      placeholder="Notes..."
    />
  )
}
