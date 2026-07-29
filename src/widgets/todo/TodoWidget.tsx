import { useState } from 'react'
import type { WidgetComponentProps } from '../types'

interface TodoItem {
  id: string
  text: string
  done: boolean
}

interface TodoData extends Record<string, unknown> {
  items?: TodoItem[]
}

export function TodoWidget({ data, onDataChange }: WidgetComponentProps<TodoData>) {
  const items = data.items ?? []
  const [newestId, setNewestId] = useState<string | null>(null)

  const addTodo = () => {
    const id = crypto.randomUUID()
    onDataChange({ ...data, items: [...items, { id, text: '', done: false }] })
    setNewestId(id)
  }

  const toggleTodo = (id: string) => {
    onDataChange({ ...data, items: items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)) })
  }

  const updateTodoText = (id: string, text: string) => {
    onDataChange({ ...data, items: items.map((item) => (item.id === id ? { ...item, text } : item)) })
  }

  const removeTodo = (id: string) => {
    onDataChange({ ...data, items: items.filter((item) => item.id !== id) })
  }

  return (
    <div className="widget widget--todo">
      <button type="button" className="widget-todo__add" onClick={addTodo} aria-label="Add todo">
        +
      </button>

      <div className="widget-todo__list">
        {items.map((item) => (
          <div key={item.id} className="widget-todo__row">
            <button
              type="button"
              className={item.done ? 'widget-todo__circle widget-todo__circle--done' : 'widget-todo__circle'}
              onClick={() => toggleTodo(item.id)}
              aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
            />
            <input
              type="text"
              className={item.done ? 'widget-todo__input widget-todo__input--done' : 'widget-todo__input'}
              value={item.text}
              onChange={(e) => updateTodoText(item.id, e.target.value)}
              placeholder="Todo..."
              autoFocus={item.id === newestId}
            />
            <button
              type="button"
              className="widget-todo__remove"
              aria-label="Remove todo"
              onClick={() => removeTodo(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
