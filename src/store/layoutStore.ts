import { create } from 'zustand'
import type { Preferences, WidgetInstance } from '../widgets/types'
import { getWidgetDefinition } from '../widgets/registry'
import { getGridDimensions } from '../canvas/gridConfig'
import { resolveGridCollisions, type CellRect } from '../canvas/gridCollision'

export const DEFAULT_PREFERENCES: Preferences = {
  reducedMotion: 'auto',
  clockFormat: '12h',
  searchEngine: 'google',
  // 0 reproduces .glass-material's original hardcoded look exactly (see
  // global.css) — existing users see no visual change until they touch the
  // new slider.
  widgetTransparency: 0,
}

/**
 * FR-28: first-run must show a non-empty, intentional layout, not a blank
 * page. Also the "starter screen" `resetToDefault` restores — per user
 * sketch: clock centered near the top, search bar centered right below it,
 * then a centered row of Todo/Links/Notes underneath. Weather is left out
 * of the default set since it needs a city typed in before it shows
 * anything — a blank "add a city" prompt isn't a good unconfigured default.
 * Computed fresh (not a static constant) since centering depends on the
 * current viewport's column count.
 */
export function createDefaultWidgets(): WidgetInstance[] {
  const clockDef = getWidgetDefinition('clock')
  const searchDef = getWidgetDefinition('search')
  const todoDef = getWidgetDefinition('todo')
  const linksDef = getWidgetDefinition('links')
  const notesDef = getWidgetDefinition('notes')
  if (!clockDef || !searchDef || !todoDef || !linksDef || !notesDef) return []

  const { columns } = getGridDimensions(window.innerWidth, window.innerHeight)
  const centerCol = (w: number) => Math.max(0, Math.floor((columns - w) / 2))
  const ROW_GAP = 1

  // Clock and search use their max size on the starter screen specifically
  // (not their normal defaultSize, which still applies when added later via
  // the gallery) — bigger reads better as the two hero elements up top.
  const clockRow = 1
  const clock: WidgetInstance = {
    id: 'default-clock',
    type: 'clock',
    // +1: one block right of center, per user adjustment.
    position: { col: centerCol(clockDef.maxSize.w) + 1, row: clockRow },
    size: clockDef.maxSize,
    data: clockDef.defaultData,
  }

  // -1: search (and, since it's derived from searchRow, the widget row
  // below it too) sits one position closer to the clock than the default
  // gap would put it, per user adjustment.
  const searchRow = clockRow + clock.size.h + ROW_GAP - 1
  const search: WidgetInstance = {
    id: 'default-search',
    type: 'search',
    // +1: one block right of center, matching the clock's shift above.
    position: { col: centerCol(searchDef.maxSize.w) + 1, row: searchRow },
    size: searchDef.maxSize,
    data: searchDef.defaultData,
  }

  // 3 empty rows so the starter To-Do shows real, editable circles+inputs
  // instead of rendering as an empty box — no example text, just structure.
  // Each input falls back to its own "Todo..." placeholder attribute, same
  // as any other empty item.
  const starterTodoData = {
    items: [
      { id: 'default-todo-item-1', text: '', done: false },
      { id: 'default-todo-item-2', text: '', done: false },
      { id: 'default-todo-item-3', text: '', done: false },
    ],
  }

  // A few sensible starter links rather than an empty tile grid.
  const starterLinksData = {
    links: [
      { id: 'default-link-github', label: 'GitHub', url: 'https://github.com' },
      { id: 'default-link-youtube', label: 'YouTube', url: 'https://youtube.com' },
      { id: 'default-link-linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
    ],
  }

  const belowRow = searchRow + search.size.h + ROW_GAP
  // colOffset: extra per-widget nudge on top of the base sequential layout
  // below — e.g. links/notes shifted right, independent of each other and
  // of Todo, per user adjustment. Not accounted for in rowWidth/centering,
  // so it opens gaps rather than closing up the row; that's the intent.
  const rowDefs = [
    { id: 'default-todo', type: 'todo', def: todoDef, colOffset: 0, data: starterTodoData as Record<string, unknown> },
    { id: 'default-links', type: 'links', def: linksDef, colOffset: 1, data: starterLinksData as Record<string, unknown> },
    { id: 'default-notes', type: 'notes', def: notesDef, colOffset: 2, data: notesDef.defaultData },
  ]
  const rowWidth = rowDefs.reduce((sum, { def }) => sum + def.defaultSize.w, 0) + ROW_GAP * (rowDefs.length - 1)
  // True center — (columns - w) / 2 puts the same center-of-mass (columns/2)
  // under any width, so this lines up with clock/search's own centerCol
  // exactly. The +1 shift tried here previously visibly broke that
  // alignment (screenshot showed it) — removed.
  let col = Math.max(0, Math.floor((columns - rowWidth) / 2))
  const rowWidgets: WidgetInstance[] = rowDefs.map(({ id, type, def, colOffset, data }) => {
    const instance: WidgetInstance = {
      id,
      type,
      position: { col: col + colOffset, row: belowRow },
      size: def.defaultSize,
      data,
    }
    col += def.defaultSize.w + ROW_GAP
    return instance
  })

  return [clock, search, ...rowWidgets]
}

function currentGridRows(): number {
  return getGridDimensions(window.innerWidth, window.innerHeight).rows
}

function toRect(widget: WidgetInstance): CellRect {
  return { col: widget.position.col, row: widget.position.row, w: widget.size.w, h: widget.size.h }
}

interface LayoutStore {
  widgets: WidgetInstance[]
  preferences: Preferences
  /** True once the initial chrome.storage.local read has resolved — gates persistence writes (see store/persistence.ts). */
  hydrated: boolean
  /** Places a new widget at its own position/size, pushing anything already there out of the way (see canvas/gridCollision.ts). */
  addWidgetAt: (instance: WidgetInstance) => void
  removeWidget: (id: string) => void
  /** Collision-aware move — pushes whatever's occupying the target cells straight down. */
  moveWidgetToCell: (id: string, col: number, row: number) => void
  /** Collision-aware resize — same push behavior as move, since growing a widget can newly overlap neighbors. */
  resizeWidgetToCells: (id: string, w: number, h: number) => void
  updateWidgetData: (id: string, data: Record<string, unknown>) => void
  setPreferences: (preferences: Preferences) => void
  hydrate: (state: { widgets: WidgetInstance[]; preferences: Preferences }) => void
  /** Discards the current widget arrangement and restores the starter layout (recomputed for the current viewport). Preferences are untouched — this resets layout, not settings. */
  resetToDefault: () => void
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

  addWidgetAt: (instance) =>
    set((s) => {
      const gridRows = currentGridRows()
      const others = s.widgets.map((w) => ({ id: w.id, rect: toRect(w) }))
      const resolved = resolveGridCollisions(instance.id, toRect(instance), others, gridRows)
      const pushedById = new Map(resolved.filter((e) => e.id !== instance.id).map((e) => [e.id, e.rect]))
      const ownRect = resolved[0].rect
      return {
        widgets: [
          ...s.widgets.map((w) => {
            const r = pushedById.get(w.id)
            return r ? { ...w, position: { col: r.col, row: r.row } } : w
          }),
          { ...instance, position: { col: ownRect.col, row: ownRect.row } },
        ],
      }
    }),

  removeWidget: (id) => set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),

  moveWidgetToCell: (id, col, row) =>
    set((s) => {
      const moving = s.widgets.find((w) => w.id === id)
      if (!moving) return s
      const gridRows = currentGridRows()
      const targetRect: CellRect = { col, row, w: moving.size.w, h: moving.size.h }
      const others = s.widgets.filter((w) => w.id !== id).map((w) => ({ id: w.id, rect: toRect(w) }))
      const resolved = resolveGridCollisions(id, targetRect, others, gridRows)
      const pushedById = new Map(resolved.filter((e) => e.id !== id).map((e) => [e.id, e.rect]))
      return {
        widgets: s.widgets.map((w) => {
          if (w.id === id) return { ...w, position: { col: targetRect.col, row: targetRect.row } }
          const r = pushedById.get(w.id)
          return r ? { ...w, position: { col: r.col, row: r.row } } : w
        }),
      }
    }),

  resizeWidgetToCells: (id, w, h) =>
    set((s) => {
      const resizing = s.widgets.find((widget) => widget.id === id)
      if (!resizing) return s
      const gridRows = currentGridRows()
      const targetRect: CellRect = { col: resizing.position.col, row: resizing.position.row, w, h }
      const others = s.widgets.filter((widget) => widget.id !== id).map((widget) => ({ id: widget.id, rect: toRect(widget) }))
      const resolved = resolveGridCollisions(id, targetRect, others, gridRows)
      const pushedById = new Map(resolved.filter((e) => e.id !== id).map((e) => [e.id, e.rect]))
      return {
        widgets: s.widgets.map((widget) => {
          if (widget.id === id) {
            return { ...widget, position: { col: targetRect.col, row: targetRect.row }, size: { w: targetRect.w, h: targetRect.h } }
          }
          const r = pushedById.get(widget.id)
          return r ? { ...widget, position: { col: r.col, row: r.row } } : widget
        }),
      }
    }),

  updateWidgetData: (id, data) => set((s) => ({ widgets: s.widgets.map((w) => (w.id === id ? { ...w, data } : w)) })),
  setPreferences: (preferences) => set({ preferences }),
  // Merges onto DEFAULT_PREFERENCES rather than trusting storage's shape
  // directly — a layout saved before a new preference (like
  // widgetTransparency) existed would otherwise hydrate with that field
  // missing.
  hydrate: (state) => set({ widgets: state.widgets, preferences: { ...DEFAULT_PREFERENCES, ...state.preferences }, hydrated: true }),
  resetToDefault: () => set({ widgets: createDefaultWidgets() }),
}))
