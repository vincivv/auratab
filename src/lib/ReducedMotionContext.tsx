import { createContext, useContext, type ReactNode } from 'react'
import { useReducedMotion } from './reducedMotion'
import type { ReducedMotionPreference } from '../widgets/types'

const ReducedMotionCtx = createContext(false)

interface ReducedMotionProviderProps {
  preference: ReducedMotionPreference
  children: ReactNode
}

/** Combines the OS-level `prefers-reduced-motion` query with the user's in-app override (NFR-6). */
export function ReducedMotionProvider({ preference, children }: ReducedMotionProviderProps) {
  const osReduced = useReducedMotion()
  const effective = preference === 'auto' ? osReduced : preference === 'on'
  return <ReducedMotionCtx.Provider value={effective}>{children}</ReducedMotionCtx.Provider>
}

export function useEffectiveReducedMotion(): boolean {
  return useContext(ReducedMotionCtx)
}
