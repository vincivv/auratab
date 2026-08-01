import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WidgetComponentProps } from '../types'

interface Note {
  id: string
  title: string
  text: string
  updatedAt: number
}

interface NotesData extends Record<string, unknown> {
  notes?: Note[]
  /** Old single-textarea shape — read once as a fallback so pre-existing content isn't silently lost, never written back in this shape again. */
  text?: string
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString([], sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Multi-note list + a full-size editor modal (rendered via a portal, since
 * it needs to escape the widget's small clipped bounds) — per a reference
 * screenshot the user shared. Deliberately scoped down from that reference:
 * plain title+textarea editing, no rich-text toolbar (bold/lists/images/
 * tables/etc. — a real editor library, not something to add incidentally),
 * no folders, no explicit "Save" button (this app auto-saves on every
 * change already, unlike the reference). Styled to match this app's
 * existing dark glass aesthetic rather than the reference's light theme.
 */
export function NotesWidget({ data, onDataChange }: WidgetComponentProps<NotesData>) {
  const notes = useMemo<Note[]>(() => {
    if (data.notes) return data.notes
    if (data.text) return [{ id: 'migrated-note', title: 'Untitled', text: data.text, updatedAt: Date.now() }]
    return []
  }, [data.notes, data.text])

  const [editingId, setEditingId] = useState<string | null>(null)
  const editingNote = notes.find((n) => n.id === editingId) ?? null

  useEffect(() => {
    if (!editingId) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingId])

  const setNotes = (nextNotes: Note[]) => onDataChange({ notes: nextNotes })

  const addNote = () => {
    const note: Note = { id: crypto.randomUUID(), title: '', text: '', updatedAt: Date.now() }
    setNotes([note, ...notes])
    setEditingId(note.id)
  }

  const removeNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const patchNote = (id: string, patch: Partial<Pick<Note, 'title' | 'text'>>) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)))
  }

  return (
    <div className="widget widget--notes">
      <button type="button" className="widget-notes__add" onClick={addNote} aria-label="New note">
        +
      </button>

      <div className="widget-notes__list">
        {notes.map((note) => (
          <div key={note.id} className="widget-notes__row-wrap">
            <button type="button" className="widget-notes__row" onClick={() => setEditingId(note.id)}>
              <span className="widget-notes__row-text">
                <span className="widget-notes__row-title">{note.title || 'Untitled'}</span>
                <span className="widget-notes__row-preview">{note.text || 'No additional text'}</span>
              </span>
              <span className="widget-notes__row-date">{formatDate(note.updatedAt)}</span>
            </button>
            <button
              type="button"
              className="widget-notes__row-remove"
              aria-label={`Delete ${note.title || 'note'}`}
              onClick={() => removeNote(note.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {editingNote &&
        createPortal(
          <div className="note-editor-backdrop" onClick={() => setEditingId(null)}>
            <div className="note-editor" onClick={(e) => e.stopPropagation()}>
              <div className="note-editor__header">
                <input
                  className="note-editor__title-input"
                  value={editingNote.title}
                  onChange={(e) => patchNote(editingNote.id, { title: e.target.value })}
                  placeholder="Untitled"
                  autoFocus
                />
                <div className="note-editor__actions">
                  <button type="button" className="note-editor__delete" onClick={() => removeNote(editingNote.id)}>
                    Delete
                  </button>
                  <button type="button" className="note-editor__close" onClick={() => setEditingId(null)}>
                    Close
                  </button>
                </div>
              </div>
              <textarea
                className="note-editor__body"
                value={editingNote.text}
                onChange={(e) => patchNote(editingNote.id, { text: e.target.value })}
                placeholder="Start writing..."
              />
              <div className="note-editor__footer">Last edit: {new Date(editingNote.updatedAt).toLocaleString()}</div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
