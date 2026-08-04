import { ReactNode, useEffect, useRef, useState } from 'react'
import { animated, to } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { useDragPhysics } from './useDragPhysics'
import { WobbleWrapper } from './WobbleWrapper'
import { RemoveBadge } from './RemoveBadge'
import { clamp } from '../lib/clamp'
import { useViewportSize } from '../lib/useViewportSize'

export interface DraggableBoxProps {
  id: string
  x: number
  y: number
  w: number
  h: number
  /** This widget's own min/max size in pixels (converted from its definition's cell-based bounds by the caller) — not a global constant, each widget type has its own. */
  minSize: { w: number; h: number }
  maxSize: { w: number; h: number }
  /** Pixel increment position/size snap to on release (the grid's DOT_SIZE) — see useDragPhysics.ts for why this can't be left to a store round-trip alone. */
  gridSize: number
  /** Edit ("jiggle") mode — dragging/resizing/wobble only engage while true. */
  editing: boolean
  onPositionChange: (id: string, pos: { x: number; y: number }) => void
  onSizeChange: (id: string, size: { w: number; h: number }) => void
  onRemove: (id: string) => void
  /** Fires whenever this box starts/stops actively being dragged or resized — lets the canvas show the grid overlay only while something's actually moving. */
  onActiveChange?: (id: string, active: boolean) => void
  /** True for widgets meant to float directly on the canvas — skips the glass card background/border/shadow, but keeps drag/resize/remove/wobble working the same as any other widget. */
  chromeless?: boolean
  /** Widget type's display name (e.g. "Quick Links"), shown as a small label in the card's top-left corner. Just a string, not widget content — doesn't violate the canvas layer's no-widget-knowledge rule. Omit for chromeless widgets, which are meant to read as bare canvas content, not a labeled card. */
  label?: string
  children: ReactNode
}

/**
 * Generic draggable/resizable/wobbling box. Operates purely on
 * {id, x, y, w, h} — must stay unaware of widget-specific content (see
 * CLAUDE.md architecture rules). Still purely pixel-based internally, same
 * as before the grid pivot — the caller (App.tsx) converts to/from grid
 * cells at the boundary, so the continuous drag/resize feel is unchanged;
 * only what happens with the position/size *on release* changed.
 */
export function DraggableBox({
  id,
  x,
  y,
  w,
  h,
  minSize,
  maxSize,
  gridSize,
  editing,
  onPositionChange,
  onSizeChange,
  onRemove,
  onActiveChange,
  chromeless,
  label,
  children,
}: DraggableBoxProps) {
  const [size, setSize] = useState({ w, h })
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const resizeOrigin = useRef(size)
  const isResizing = useRef(false)
  const bounds = useViewportSize()

  useEffect(() => {
    onActiveChange?.(id, dragging || resizing)
  }, [id, dragging, resizing, onActiveChange])

  // The store rounds a raw resize-drag size to the nearest whole grid cell
  // and may reject it (min/max clamp) — without this, the box would keep
  // showing whatever continuous size it was dragged to instead of snapping
  // to what was actually committed. Skipped mid-gesture so it doesn't fight
  // the live drag.
  useEffect(() => {
    if (!isResizing.current) setSize({ w, h })
  }, [w, h])

  const { posX, posY, scale, shadow, bind } = useDragPhysics({
    x,
    y,
    w: size.w,
    h: size.h,
    bounds,
    gridSize,
    enabled: editing,
    onDragEnd: (pos) => onPositionChange(id, pos),
    onDragStateChange: setDragging,
  })

  const bindResize = useDrag(({ movement: [mx, my], first, last }) => {
    if (first) {
      resizeOrigin.current = size
      isResizing.current = true
      setResizing(true)
    }
    // Resize is also bounded to the viewport — the box's bottom/right edge
    // can't be dragged past the screen either (same invariant as drag).
    const maxW = Math.max(minSize.w, bounds.width - x)
    const maxH = Math.max(minSize.h, bounds.height - y)
    const nextSize = {
      w: clamp(resizeOrigin.current.w + mx, minSize.w, Math.min(maxSize.w, maxW)),
      h: clamp(resizeOrigin.current.h + my, minSize.h, Math.min(maxSize.h, maxH)),
    }
    if (last) {
      // Same fix as the drag-position case in useDragPhysics.ts: snap here,
      // immediately, rather than trusting the store round-trip to correct
      // it — if the resize rounds back to the same cell size it started at,
      // the store value doesn't change and nothing would otherwise re-sync
      // this box's local `size` to an exact grid multiple.
      const snapped = {
        w: clamp(Math.round(nextSize.w / gridSize) * gridSize, minSize.w, Math.min(maxSize.w, maxW)),
        h: clamp(Math.round(nextSize.h / gridSize) * gridSize, minSize.h, Math.min(maxSize.h, maxH)),
      }
      setSize(snapped)
      isResizing.current = false
      setResizing(false)
      onSizeChange(id, snapped)
      return
    }
    setSize(nextSize)
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
        // floating), growing further on grab — skipped for chromeless
        // widgets, there's no card surface for a shadow to belong to.
        boxShadow: chromeless ? undefined : shadow.to((s) => `0 ${6 + 14 * s}px ${24 + 30 * s}px rgba(0, 0, 0, ${0.24 + 0.26 * s})`),
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
        {chromeless ? (
          <div className="draggable-box__content">{children}</div>
        ) : (
          <div className="glass-surface glass-material">
            {label && <span className={editing ? 'widget-label widget-label--edit-shifted' : 'widget-label'}>{label}</span>}
            <div className={label ? 'draggable-box__content draggable-box__content--labeled' : 'draggable-box__content'}>{children}</div>
          </div>
        )}

        {editing && <RemoveBadge onRemove={() => onRemove(id)} />}

        {/* Same handle for chromeless widgets as carded ones now (per user
            request — drag-to-resize, not tap-to-cycle). Trade-off, flagged
            not hidden: pairing this with the remove badge at the opposite
            corner reintroduces the "implied box edge" look chromeless
            widgets were built to avoid — accepted deliberately, see
            MILESTONES.md 2026-07-30. */}
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
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </div>
            )
          })()}
      </WobbleWrapper>
    </animated.div>
  )
}
