import type { ComponentType } from 'react'
import type { BackgroundSelection } from '../backgrounds/types'

export type ReducedMotionPreference = 'auto' | 'on' | 'off'
export type ClockFormat = '12h' | '24h'
export type SearchEngineId = 'google' | 'bing' | 'duckduckgo'

/** Matches LayoutState.preferences in spec §8. */
export interface Preferences {
  reducedMotion: ReducedMotionPreference
  clockFormat: ClockFormat
  searchEngine: SearchEngineId
  /** 0-1, how see-through the glass card shell is (not widget content —
   * text/controls stay fully readable at any setting). 0 = the original
   * frosted-glass look (max blur, subtle white tint); 1 = fully
   * transparent (no tint, minimal blur, background clearly visible through
   * it). Drives the --widget-transparency CSS var, which both the tint
   * alpha and the blur amount are computed from in global.css. */
  widgetTransparency: number
  /** Which background .canvas renders — a curated gradient preset or a user-uploaded image (blob lives in IndexedDB, not here). See backgrounds/types.ts. */
  background: BackgroundSelection
}

export interface WidgetInstance {
  id: string
  type: string
  /** Grid cell coordinates (not pixels) — see canvas/gridConfig.ts. */
  position: { col: number; row: number }
  /** Size in whole grid cells (not pixels). */
  size: { w: number; h: number }
  data: Record<string, unknown>
}

export interface WidgetComponentProps<TData extends Record<string, unknown> = Record<string, unknown>> {
  data: TData
  onDataChange: (data: TData) => void
  preferences: Preferences
}

/**
 * Adapted from spec §6.3's WidgetDefinition (which specifies a vanilla
 * render(container, state, onStateChange) signature) into a React-idiomatic
 * form — a component instead of a manual render function — since the stack
 * is already React throughout. Same contract otherwise: canvas owns
 * position/size/edit chrome, each widget owns its own content and data
 * shape.
 */
export interface WidgetDefinition<TData extends Record<string, unknown> = Record<string, unknown>> {
  type: string
  displayName: string
  /** All three in whole grid cells, not pixels — see canvas/gridConfig.ts. */
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
  maxSize: { w: number; h: number }
  /** True for widgets meant to float directly on the canvas with no glass card behind them (e.g. Clock, Search) — still draggable/resizable/removable in edit mode, just no visible chrome. */
  chromeless?: boolean
  defaultData: TData
  Component: ComponentType<WidgetComponentProps<TData>>
}
