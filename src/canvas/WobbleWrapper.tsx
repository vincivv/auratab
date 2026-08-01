import { CSSProperties, ReactNode, useMemo } from 'react'
import { useEffectiveReducedMotion } from '../lib/ReducedMotionContext'

interface WobbleWrapperProps {
  /** Wobble plays while true — caller decides (editing && not the widget currently being dragged). */
  active: boolean
  children: ReactNode
}

const WOBBLE_DURATION_MS = 260
const WOBBLE_AMPLITUDE_DEG = 1.2

/** FR-2: continuous subtle rotation oscillation, per-instance phase offset so widgets don't sync. */
export function WobbleWrapper({ active, children }: WobbleWrapperProps) {
  const reducedMotion = useEffectiveReducedMotion()
  // Negative animation-delay starts each instance at a different point in the
  // cycle rather than all animating in lockstep.
  const phaseOffsetMs = useMemo(() => Math.random() * WOBBLE_DURATION_MS, [])

  const style: CSSProperties =
    active && !reducedMotion
      ? {
          animationName: 'auratab-wobble',
          animationDuration: `${WOBBLE_DURATION_MS}ms`,
          animationDelay: `-${phaseOffsetMs}ms`,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'ease-in-out',
          ...({ '--wobble-amplitude': `${WOBBLE_AMPLITUDE_DEG}deg` } as CSSProperties),
        }
      : {}

  return (
    <div className="wobble-wrapper" style={style}>
      {children}
    </div>
  )
}
