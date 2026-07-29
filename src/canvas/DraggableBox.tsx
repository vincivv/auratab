import { ReactNode, useRef, useState } from 'react'
import { animated, to } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { useDragPhysics } from './useDragPhysics'
import { WobbleWrapper } from './WobbleWrapper'
import { RemoveBadge } from './RemoveBadge'
import { MIN_WIDGET_SIZE, MAX_WIDGET_SIZE } from './gridConfig'
import { clamp } from '../lib/clamp'
import { useViewportSize } from '../lib/useViewportSize'

export interface DraggableBoxProps {
  id: string
  x: number
  y: number
  w: number
  h: number
  /** Edit ("jiggle") mode — dragging/resizing/wobble only engage while true. */
  editing: boolean
  onPositionChange: (id: string, pos: { x: number; y: number }) => void
  onSizeChange: (id: string, size: { w: number; h: number }) => void
  onRemove: (id: string) => void
  children: ReactNode
}

/**
 * Generic draggable/resizable/wobbling box. Operates purely on
 * {id, x, y, w, h} — must stay unaware of widget-specific content (see
 * CLAUDE.md architecture rules).
 */
export function DraggableBox({ id, x, y, w, h, editing, onPositionChange, onSizeChange, onRemove, children }: DraggableBoxProps) {
  const [size, setSize] = useState({ w, h })
  const [dragging, setDragging] = useState(false)
  const resizeOrigin = useRef(size)
  const bounds = useViewportSize()

  const { posX, posY, scale, shadow, bind } = useDragPhysics({
    x,
    y,
    w: size.w,
    h: size.h,
    bounds,
    enabled: editing,
    onDragEnd: (pos) => onPositionChange(id, pos),
    onDragStateChange: setDragging,
  })

  const bindResize = useDrag(({ movement: [mx, my], first, last }) => {
    if (first) resizeOrigin.current = size
    // Resize is also bounded to the viewport — the box's bottom/right edge
    // can't be dragged past the screen either (same invariant as drag).
    const maxW = Math.max(MIN_WIDGET_SIZE.w, bounds.width - x)
    const maxH = Math.max(MIN_WIDGET_SIZE.h, bounds.height - y)
    const nextSize = {
      w: clamp(resizeOrigin.current.w + mx, MIN_WIDGET_SIZE.w, Math.min(MAX_WIDGET_SIZE.w, maxW)),
      h: clamp(resizeOrigin.current.h + my, MIN_WIDGET_SIZE.h, Math.min(MAX_WIDGET_SIZE.h, maxH)),
    }
    setSize(nextSize)
    if (last) onSizeChange(id, nextSize)
  })

  return (
    <animated.div
      {...(editing ? bind() : {})}
      className="draggable-box"
      style={{
        width: size.w,
        height: size.h,
        transform: to([posX, posY, scale], (px, py, s) => `translate3d(${px}px, ${py}px, 0) scale(${s})`),
        // Resting depth even when idle (the glass card should look like it's
        // floating), growing further on grab.
        boxShadow: shadow.to((s) => `0 ${6 + 14 * s}px ${24 + 30 * s}px rgba(0, 0, 0, ${0.24 + 0.26 * s})`),
        touchAction: editing ? 'none' : 'auto',
        cursor: editing ? 'grab' : 'default',
        zIndex: dragging ? 10 : 1,
      }}
    >
      {/* Wobble rotates the whole rigid unit — glass block, content, remove
          badge, and resize handle together — instead of just the content
          inside a static block. Kept as its own element (rather than folded
          into .draggable-box's transform) because that element's transform
          is already driven imperatively by the drag spring every frame;
          layering a CSS keyframe rotation onto the same `transform` property
          would fight it. Glass-surface still gets its own layer underneath
          so its rounded-corner overflow clip can't clip the resize handle
          or remove badge, which are its siblings here, not its children. */}
      <WobbleWrapper active={editing && !dragging}>
        <div className="glass-surface glass-material">
          <div className="draggable-box__content">{children}</div>
        </div>

        {editing && <RemoveBadge onRemove={() => onRemove(id)} />}

        {editing &&
          (() => {
            const resizeGesture = bindResize()
            return (
              <div
                className="resize-handle"
                {...resizeGesture}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  resizeGesture.onPointerDown?.(e)
                }}
              />
            )
          })()}
      </WobbleWrapper>
    </animated.div>
  )
}
