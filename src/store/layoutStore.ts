import { create } from 'zustand'
import type { Preferences, WidgetInstance } from '../widgets/types'
import { getWidgetDefinition } from '../widgets/registry'
import { GRID_UNIT } from '../canvas/gridConfig'

export const DEFAULT_PREFERENCES: Preferences = {
  reducedMotion: 'auto',
  clockFormat: '12h',
  searchEngine: 'google',
}

/** FR-28: first-run must show a non-empty, intentional layout, not a blank page. */
export function createDefaultWidgets(): WidgetInstance[] {
  const def = getWidgetDefinition('clock')
  if (!def) return []
  return [
    {
      id: 'default-clock',
      type: 'clock',
      position: { x: GRID_UNIT * 10, y: GRID_UNIT * 10 },
      size: def.defaultSize,
      data: def.defaultData,
    },
  ]
}

interface LayoutStore {
  widgets: WidgetInstance[]
  preferences: Preferences
  /** True once the initial chrome.storage.local read has resolved — gates persistence writes (see store/persistence.ts). */
  hydrated: boolean
  addWidget: (instance: WidgetInstance) => void
  removeWidget: (id: string) => void
  updateWidgetPosition: (id: string, position: { x: number; y: number }) => void
  updateWidgetSize: (id: string, size: { w: number; h: number }) => void
  updateWidgetData: (id: string, data: Record<string, unknown>) => void
  setPreferences: (preferences: Preferences) => void
  hydrate: (state: { widgets: WidgetInstance[]; preferences: Preferences }) => void
}

/**
 * Single source of truth for layout state (spec §6.2). Edit-mode/settings-
 * open state is deliberately NOT here — that's ephemeral UI state and stays
 * as local useState in App.tsx, never persisted.
 */
export const useLayoutStore = create<LayoutStore>((set) => ({
  widgets: createDefaultWidgets(),
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,
  addWidget: (instance) => set((s) => ({ widgets: [...s.widgets, instance] })),
  removeWidget: (id) => set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),
  updateWidgetPosition: (id, position) =>
    set((s) => ({ widgets: s.widgets.map((w) => (w.id === id ? { ...w, position } : w)) })),
  updateWidgetSize: (id, size) => set((s) => ({ widgets: s.widgets.map((w) => (w.id === id ? { ...w, size } : w)) })),
  updateWidgetData: (id, data) => set((s) => ({ widgets: s.widgets.map((w) => (w.id === id ? { ...w, data } : w)) })),
  setPreferences: (preferences) => set({ preferences }),
  hydrate: (state) => set({ widgets: state.widgets, preferences: state.preferences, hydrated: true }),
}))
