import { useCallback, useState } from 'react'
import { DraggableBox } from './canvas/DraggableBox'
import { useEditMode } from './canvas/useEditMode'
import { useLongPress } from './canvas/useLongPress'
import { GRID_UNIT } from './canvas/gridConfig'

/**
 * Day 1 scaffold: a single placeholder widget to validate the Day 1 exit
 * criteria (spec §9) — drag, resize, and wobble must feel physically
 * convincing before any real widget/registry/background work starts. See
 * MILESTONES.md.
 */
export default function App() {
  const { editing, enter, exit, toggle } = useEditMode()
  const [box, setBox] = useState({ x: GRID_UNIT * 10, y: GRID_UNIT * 10, w: GRID_UNIT * 20, h: GRID_UNIT * 20 })

  const longPress = useLongPress({ onLongPress: enter })

  const handlePositionChange = useCallback((_id: string, pos: { x: number; y: number }) => {
    setBox((b) => ({ ...b, ...pos }))
  }, [])

  const handleSizeChange = useCallback((_id: string, size: { w: number; h: number }) => {
    setBox((b) => ({ ...b, ...size }))
  }, [])

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent) => {
      longPress.onPointerUp()
      // FR-5: tapping empty canvas while in edit mode exits edit mode.
      if (editing && e.target === e.currentTarget) exit()
    },
    [editing, exit, longPress],
  )

  return (
    <div
      className="canvas"
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerLeave={longPress.onPointerLeave}
    >
      <button type="button" className="edit-toggle" onClick={toggle} aria-label="Toggle edit mode">
        {editing ? 'Done' : '✎'}
      </button>

      <DraggableBox
        id="placeholder"
        x={box.x}
        y={box.y}
        w={box.w}
        h={box.h}
        editing={editing}
        onPositionChange={handlePositionChange}
        onSizeChange={handleSizeChange}
      >
        <div className="placeholder-widget">Widget</div>
      </DraggableBox>
    </div>
  )
}
