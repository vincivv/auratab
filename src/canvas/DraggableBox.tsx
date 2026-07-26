import { ReactNode, useRef, useState } from 'react'
import { animated, to } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { useDragPhysics } from './useDragPhysics'
import { WobbleWrapper } from './WobbleWrapper'
import { MIN_WIDGET_SIZE, MAX_WIDGET_SIZE } from './gridConfig'
import { clamp } from '../lib/clamp'

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
  children: ReactNode
}

/**
 * Generic draggable/resizable/wobbling box. Operates purely on
 * {id, x, y, w, h} — must stay unaware of widget-specific content (see
 * CLAUDE.md architecture rules).
 */
export function DraggableBox({ id, x, y, w, h, editing, onPositionChange, onSizeChange, children }: DraggableBoxProps) {
  const [size, setSize] = useState({ w, h })
  const [dragging, setDragging] = useState(false)
  const resizeOrigin = useRef(size)

  const { posX, posY, scale, shadow, bind } = useDragPhysics({
    x,
    y,
    enabled: editing,
    onDragEnd: (pos) => onPositionChange(id, pos),
    onDragStateChange: setDragging,
  })

  const bindResize = useDrag(({ movement: [mx, my], first, last }) => {
    if (first) resizeOrigin.current = size
    const nextSize = {
      w: clamp(resizeOrigin.current.w + mx, MIN_WIDGET_SIZE.w, MAX_WIDGET_SIZE.w),
      h: clamp(resizeOrigin.current.h + my, MIN_WIDGET_SIZE.h, MAX_WIDGET_SIZE.h),
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
        boxShadow: shadow.to((s) => `0 ${8 * s}px ${24 * s}px rgba(0, 0, 0, ${0.35 * s})`),
        touchAction: editing ? 'none' : 'auto',
        cursor: editing ? 'grab' : 'default',
        zIndex: dragging ? 10 : 1,
      }}
    >
      <WobbleWrapper active={editing && !dragging}>
        <div className="draggable-box__content">{children}</div>
      </WobbleWrapper>

      {editing && <div className="resize-handle" {...bindResize()} />}
    </animated.div>
  )
}
