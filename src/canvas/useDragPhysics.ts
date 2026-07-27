import { useEffect, useRef } from 'react'
import { useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { snapToGrid } from './snapToGrid'
import { clampToViewport } from './clampToViewport'

/**
 * Tunable spring constants — this is the Day 1 "feel" gate (spec §10's
 * highest-risk item). Iterate these by hand against real interaction, not by
 * formula. DRAG_CONFIG governs the lag/catch-up while the pointer is down
 * (FR-8); RELEASE_CONFIG governs the settle once the pointer lifts.
 */
const DRAG_CONFIG = { tension: 420, friction: 34 }
const RELEASE_CONFIG = { tension: 280, friction: 22 }
const GRAB_SCALE = 1.04

interface UseDragPhysicsOptions {
  x: number
  y: number
  w: number
  h: number
  /** Widget stays fully within these bounds — can't be dragged off-screen. */
  bounds: { width: number; height: number }
  enabled: boolean
  onDragEnd: (pos: { x: number; y: number }) => void
  onDragStateChange?: (dragging: boolean) => void
}

export function useDragPhysics({ x, y, w, h, bounds, enabled, onDragEnd, onDragStateChange }: UseDragPhysicsOptions) {
  const dragOrigin = useRef({ x, y })
  const isDragging = useRef(false)

  const [{ posX, posY, scale, shadow }, api] = useSpring(() => ({
    posX: x,
    posY: y,
    scale: 1,
    shadow: 0,
    config: RELEASE_CONFIG,
  }))

  // External position changes (e.g. hydrated from storage) should still animate in.
  useEffect(() => {
    if (!isDragging.current) {
      api.start({ posX: x, posY: y, config: RELEASE_CONFIG })
    }
  }, [x, y, api])

  const bind = useDrag(
    ({ down, movement: [mx, my], first, last }) => {
      if (!enabled) return

      if (first) {
        dragOrigin.current = { x, y }
        isDragging.current = true
        onDragStateChange?.(true)
      }

      const rawX = dragOrigin.current.x + mx
      const rawY = dragOrigin.current.y + my
      const { x: targetX, y: targetY } = clampToViewport(rawX, rawY, w, h, bounds)

      if (last) {
        isDragging.current = false
        onDragStateChange?.(false)
        const snappedRaw = snapToGrid(targetX, targetY)
        const snapped = clampToViewport(snappedRaw.x, snappedRaw.y, w, h, bounds)
        api.start({ posX: snapped.x, posY: snapped.y, scale: 1, shadow: 0, config: RELEASE_CONFIG })
        onDragEnd(snapped)
        return
      }

      // Spring chases the pointer target rather than snapping to it 1:1 —
      // this is what produces the "lags slightly behind" feel (FR-8).
      api.start({ posX: targetX, posY: targetY, scale: down ? GRAB_SCALE : 1, shadow: down ? 1 : 0, config: DRAG_CONFIG })
    },
    { enabled },
  )

  return { posX, posY, scale, shadow, bind }
}
