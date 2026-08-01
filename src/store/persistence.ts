import { useEffect, useRef } from 'react'
import { useLayoutStore } from './layoutStore'
import type { Preferences, WidgetInstance } from '../widgets/types'

/**
 * Versioned key naming is intentional — anticipates a future migration when
 * the widget schema changes (spec §8). Bumped v1 -> v2 here: position/size
 * moved from free pixels to grid-cell coordinates (2026-07-29 grid pivot),
 * an incompatible shape change. No migration written — old v1 data is just
 * left in place, unread; a v1-only user starts over on the new grid rather
 * than having stale pixel coordinates reinterpreted as cell coordinates.
 *
 * Left as `tabscape_...` even after the 2026-07-30 product rename to
 * AuraTab — this string is never user-visible, and renaming it would
 * orphan every saved layout again (same effect as the v1->v2 bump above),
 * for zero benefit. Fine to rename opportunistically alongside a real
 * schema change later; not worth a dedicated migration on its own.
 */
const STORAGE_KEY = 'tabscape_layout_v2'
const WRITE_DEBOUNCE_MS = 400

interface PersistedLayout {
  widgets: WidgetInstance[]
  preferences: Preferences
}

async function loadPersistedLayout(): Promise<PersistedLayout | undefined> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] as PersistedLayout | undefined
}

function writePersistedLayout(layout: PersistedLayout): void {
  void chrome.storage.local.set({ [STORAGE_KEY]: layout })
}

/**
 * Hydrates the layout store from chrome.storage.local once on mount, then
 * keeps it in sync on every change, debounced (spec §6.2 — 300–500ms after
 * the mutation, not per animation frame). Call once, at the app root.
 */
export function useLayoutPersistence(): void {
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    loadPersistedLayout().then((saved) => {
      if (cancelled) return
      if (saved) {
        // Saved state exists — even an empty widgets array reflects a real
        // past decision (e.g. the user removed everything) and must win
        // over the seeded FR-28 default, which only applies on a true first run.
        useLayoutStore.getState().hydrate(saved)
      } else {
        useLayoutStore.setState({ hydrated: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const unsubscribe = useLayoutStore.subscribe((state) => {
      if (!state.hydrated) return
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        writePersistedLayout({ widgets: state.widgets, preferences: state.preferences })
      }, WRITE_DEBOUNCE_MS)
    })
    return () => {
      unsubscribe()
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [])
}
