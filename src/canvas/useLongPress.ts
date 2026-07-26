import { useCallback, useRef } from 'react'
import type { PointerEvent } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  delayMs?: number
  moveThresholdPx?: number
}

/** Generic long-press gesture (FR-1). Cancels if the pointer moves too far before the delay elapses. */
export function useLongPress({ onLongPress, delayMs = 500, moveThresholdPx = 8 }: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null)
  const originRef = useRef({ x: 0, y: 0 })

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      originRef.current = { x: e.clientX, y: e.clientY }
      clear()
      timerRef.current = window.setTimeout(onLongPress, delayMs)
    },
    [onLongPress, delayMs, clear],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const dx = e.clientX - originRef.current.x
      const dy = e.clientY - originRef.current.y
      if (Math.hypot(dx, dy) > moveThresholdPx) clear()
    },
    [clear, moveThresholdPx],
  )

  return { onPointerDown, onPointerMove, onPointerUp: clear, onPointerLeave: clear }
}
