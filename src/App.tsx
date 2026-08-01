import { useCallback, useRef, useState } from 'react'
import { DraggableBox } from './canvas/DraggableBox'
import { useEditMode } from './canvas/useEditMode'
import { useLongPress } from './canvas/useLongPress'
import { cellToPx, DOT_SIZE, getGridDimensions, pxToCell } from './canvas/gridConfig'
import { clamp } from './lib/clamp'
import { getWidgetDefinition } from './widgets/registry'
import { SettingsPanel } from './settings/SettingsPanel'
import { ReducedMotionProvider } from './lib/ReducedMotionContext'
import { useLayoutStore } from './store/layoutStore'
import { useLayoutPersistence } from './store/persistence'

export default function App() {
  useLayoutPersistence()

  const widgets = useLayoutStore((s) => s.widgets)
  const preferences = useLayoutStore((s) => s.preferences)
  const addWidgetAt = useLayoutStore((s) => s.addWidgetAt)
  const removeWidgetInstance = useLayoutStore((s) => s.removeWidget)
  const moveWidgetToCell = useLayoutStore((s) => s.moveWidgetToCell)
  const resizeWidgetToCells = useLayoutStore((s) => s.resizeWidgetToCells)
  const updateWidgetData = useLayoutStore((s) => s.updateWidgetData)
  const setPreferences = useLayoutStore((s) => s.setPreferences)
  const resetToDefault = useLayoutStore((s) => s.resetToDefault)

  const { editing, enter, exit } = useEditMode()
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Which widgets are actively being dragged/resized right now — non-empty
  // means show the grid dot overlay (see .canvas__grid-overlay).
  const [activeWidgetIds, setActiveWidgetIds] = useState<Set<string>>(new Set())

  const handleActiveChange = useCallback((id: string, active: boolean) => {
    setActiveWidgetIds((prev) => {
      if (active === prev.has(id)) return prev
      const next = new Set(prev)
      if (active) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  // Tracks whether edit mode was just entered by the in-progress long-press
  // gesture, so its own release doesn't immediately trigger the tap-outside-
  // to-exit check below (FR-5) and undo the entry it just caused.
  const justEnteredRef = useRef(false)
  const handleLongPress = useCallback(() => {
    justEnteredRef.current = true
    enter()
  }, [enter])
  const longPress = useLongPress({ onLongPress: handleLongPress })

  // DraggableBox reports pixel positions (it stays purely pixel-based, same
  // as before the grid pivot — see its doc comment). This is the boundary
  // where a release gets rounded to the nearest cell and handed to the
  // collision-aware store action.
  const handlePositionChange = useCallback(
    (id: string, pixelPos: { x: number; y: number }) => {
      const widget = useLayoutStore.getState().widgets.find((w) => w.id === id)
      if (!widget) return
      const { columns, rows } = getGridDimensions(window.innerWidth, window.innerHeight)
      const col = clamp(pxToCell(pixelPos.x), 0, Math.max(0, columns - widget.size.w))
      const row = clamp(pxToCell(pixelPos.y), 0, Math.max(0, rows - widget.size.h))
      moveWidgetToCell(id, col, row)
    },
    [moveWidgetToCell],
  )

  const handleSizeChange = useCallback(
    (id: string, pixelSize: { w: number; h: number }) => {
      resizeWidgetToCells(id, Math.max(1, pxToCell(pixelSize.w)), Math.max(1, pxToCell(pixelSize.h)))
    },
    [resizeWidgetToCells],
  )

  const addWidget = useCallback(
    (type: string, dropPoint?: { x: number; y: number }) => {
      const def = getWidgetDefinition(type)
      if (!def) return
      const { columns, rows } = getGridDimensions(window.innerWidth, window.innerHeight)
      let col: number
      let row: number
      if (dropPoint) {
        // Center the new widget under the drop point rather than anchoring
        // its top-left corner there.
        col = pxToCell(dropPoint.x - cellToPx(def.defaultSize.w) / 2)
        row = pxToCell(dropPoint.y - cellToPx(def.defaultSize.h) / 2)
      } else {
        // Simple diagonal cascade for click-to-add (no specific drop point).
        const step = useLayoutStore.getState().widgets.length % 6
        col = 1 + step
        row = 1 + step
      }
      col = clamp(col, 0, Math.max(0, columns - def.defaultSize.w))
      row = clamp(row, 0, Math.max(0, rows - def.defaultSize.h))
      addWidgetAt({ id: crypto.randomUUID(), type, position: { col, row }, size: def.defaultSize, data: def.defaultData })
    },
    [addWidgetAt],
  )

  const handleEnterEditModeFromSettings = useCallback(() => {
    setSettingsOpen(false)
    enter()
  }, [enter])

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent) => {
      longPress.onPointerUp()
      if (justEnteredRef.current) {
        justEnteredRef.current = false
        return
      }
      // FR-5: tapping empty canvas while in edit mode exits edit mode.
      if (editing && e.target === e.currentTarget) exit()
    },
    [editing, exit, longPress],
  )

  return (
    <ReducedMotionProvider preference={preferences.reducedMotion}>
      <div
        className="canvas"
        style={{ ['--dot-size' as string]: `${DOT_SIZE}px` }}
        onPointerDown={longPress.onPointerDown}
        onPointerMove={longPress.onPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={longPress.onPointerLeave}
      >
        <div
          className={activeWidgetIds.size > 0 ? 'canvas__grid-overlay canvas__grid-overlay--visible' : 'canvas__grid-overlay'}
          aria-hidden="true"
        />

        {!editing && (
          <button
            type="button"
            className={settingsOpen ? 'settings-tab-toggle settings-tab-toggle--open' : 'settings-tab-toggle'}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
          >
            {settingsOpen ? '›' : '‹'}
          </button>
        )}

        {widgets.map((instance) => {
          const def = getWidgetDefinition(instance.type)
          if (!def) return null
          const WidgetComponent = def.Component
          return (
            <DraggableBox
              key={instance.id}
              id={instance.id}
              x={cellToPx(instance.position.col)}
              y={cellToPx(instance.position.row)}
              w={cellToPx(instance.size.w)}
              h={cellToPx(instance.size.h)}
              minSize={{ w: cellToPx(def.minSize.w), h: cellToPx(def.minSize.h) }}
              maxSize={{ w: cellToPx(def.maxSize.w), h: cellToPx(def.maxSize.h) }}
              gridSize={DOT_SIZE}
              editing={editing}
              onPositionChange={handlePositionChange}
              onSizeChange={handleSizeChange}
              onRemove={removeWidgetInstance}
              onActiveChange={handleActiveChange}
              chromeless={def.chromeless}
              label={def.chromeless ? undefined : def.displayName}
            >
              <WidgetComponent
                data={instance.data}
                onDataChange={(data) => updateWidgetData(instance.id, data)}
                preferences={preferences}
              />
            </DraggableBox>
          )
        })}

        <SettingsPanel
          open={settingsOpen}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onAddWidget={addWidget}
          onDropWidget={addWidget}
          onEnterEditMode={handleEnterEditModeFromSettings}
          onResetLayout={resetToDefault}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </ReducedMotionProvider>
  )
}
