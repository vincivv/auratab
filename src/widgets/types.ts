import type { ComponentType } from 'react'

export type ReducedMotionPreference = 'auto' | 'on' | 'off'
export type ClockFormat = '12h' | '24h'
export type SearchEngineId = 'google' | 'bing' | 'duckduckgo'

/** Matches LayoutState.preferences in spec §8. */
export interface Preferences {
  reducedMotion: ReducedMotionPreference
  clockFormat: ClockFormat
  searchEngine: SearchEngineId
}

export interface WidgetInstance {
  id: string
  type: string
  position: { x: number; y: number }
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
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
  maxSize: { w: number; h: number }
  defaultData: TData
  Component: ComponentType<WidgetComponentProps<TData>>
}
