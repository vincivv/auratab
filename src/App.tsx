import { useCallback, useRef, useState } from 'react'
import { DraggableBox } from './canvas/DraggableBox'
import { clampToViewport } from './canvas/clampToViewport'
import { useEditMode } from './canvas/useEditMode'
import { useLongPress } from './canvas/useLongPress'
import { GRID_UNIT } from './canvas/gridConfig'
import { getWidgetDefinition } from './widgets/registry'
import { SettingsPanel } from './settings/SettingsPanel'
import { ReducedMotionProvider } from './lib/ReducedMotionContext'
import { useLayoutStore } from './store/layoutStore'
import { useLayoutPersistence } from './store/persistence'

export default function App() {
  useLayoutPersistence()

  const widgets = useLayoutStore((s) => s.widgets)
  const preferences = useLayoutStore((s) => s.preferences)
  const addWidgetInstance = useLayoutStore((s) => s.addWidget)
  const removeWidgetInstance = useLayoutStore((s) => s.removeWidget)
  const updateWidgetPosition = useLayoutStore((s) => s.updateWidgetPosition)
  const updateWidgetSize = useLayoutStore((s) => s.updateWidgetSize)
  const updateWidgetData = useLayoutStore((s) => s.updateWidgetData)
  const setPreferences = useLayoutStore((s) => s.setPreferences)

  const { editing, enter, exit } = useEditMode()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Tracks whether edit mode was just entered by the in-progress long-press
  // gesture, so its own release doesn't immediately trigger the tap-outside-
  // to-exit check below (FR-5) and undo the entry it just caused.
  const justEnteredRef = useRef(false)
  const handleLongPress = useCallback(() => {
    justEnteredRef.current = true
    enter()
  }, [enter])
  const longPress = useLongPress({ onLongPress: handleLongPress })

  const addWidget = useCallback(
    (type: string, dropPoint?: { x: number; y: number }) => {
      const def = getWidgetDefinition(type)
      if (!def) return
      let rawX: number
      let rawY: number
      if (dropPoint) {
        // Center the new widget under the drop point rather than anchoring
        // its top-left corner there.
        rawX = dropPoint.x - def.defaultSize.w / 2
        rawY = dropPoint.y - def.defaultSize.h / 2
      } else {
        const cascade = (useLayoutStore.getState().widgets.length % 6) * GRID_UNIT * 4
        rawX = GRID_UNIT * 10 + cascade
        rawY = GRID_UNIT * 10 + cascade
      }
      const { x, y } = clampToViewport(rawX, rawY, def.defaultSize.w, def.defaultSize.h, {
        width: window.innerWidth,
        height: window.innerHeight,
      })
      addWidgetInstance({ id: crypto.randomUUID(), type, position: { x, y }, size: def.defaultSize, data: def.defaultData })
    },
    [addWidgetInstance],
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
        onPointerDown={longPress.onPointerDown}
        onPointerMove={longPress.onPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={longPress.onPointerLeave}
      >
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
              x={instance.position.x}
              y={instance.position.y}
              w={instance.size.w}
              h={instance.size.h}
              editing={editing}
              onPositionChange={updateWidgetPosition}
              onSizeChange={updateWidgetSize}
              onRemove={removeWidgetInstance}
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
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </ReducedMotionProvider>
  )
}
