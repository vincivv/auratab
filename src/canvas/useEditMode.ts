import { useCallback, useState } from 'react'

/** Edit-mode state machine (FR-1, FR-5, FR-6). Ephemeral UI state — never persisted (see §6.2). */
export function useEditMode() {
  const [editing, setEditing] = useState(false)

  const enter = useCallback(() => setEditing(true), [])
  const exit = useCallback(() => setEditing(false), [])
  const toggle = useCallback(() => setEditing((v) => !v), [])

  return { editing, enter, exit, toggle }
}
