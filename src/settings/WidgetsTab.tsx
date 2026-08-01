import { widgetRegistry } from '../widgets/registry'
import { WIDGET_DRAG_MIME } from './widgetDragType'
import { cellToPx } from '../canvas/gridConfig'
import type { Preferences } from '../widgets/types'

interface WidgetsTabProps {
  preferences: Preferences
  onAddWidget: (type: string) => void
}

const PREVIEW_FRAME = { w: 92, h: 56 }

function noop() {}

/**
 * The widget gallery (FR-13/14), living inside Settings rather than a
 * separate "+" control. Cards are both click-to-add (cascaded default
 * position) and drag-and-drop-able onto the canvas (dropped at the pointer).
 *
 * Each card previews the widget by rendering the real widget component at
 * its real default size, then scaling that down to fit a small frame — so
 * the preview is guaranteed to match what actually lands on the canvas
 * (including current preferences like clock format) rather than a hand-drawn
 * icon that could drift out of sync.
 */
export function WidgetsTab({ preferences, onAddWidget }: WidgetsTabProps) {
  return (
    <div className="settings-widgets-grid">
      {widgetRegistry.map((def) => {
        const Preview = def.Component
        const widthPx = cellToPx(def.defaultSize.w)
        const heightPx = cellToPx(def.defaultSize.h)
        const scale = Math.min(PREVIEW_FRAME.w / widthPx, PREVIEW_FRAME.h / heightPx)
        return (
          <div
            key={def.type}
            className="settings-widget-card"
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(WIDGET_DRAG_MIME, def.type)
              e.dataTransfer.effectAllowed = 'copy'
            }}
            onClick={() => onAddWidget(def.type)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onAddWidget(def.type)
              }
            }}
          >
            {/* inert (not just aria-hidden/pointer-events:none) so the real
                interactive controls rendered inside for visual fidelity
                — inputs, textareas, the links "+" button — can't be
                keyboard-tabbed into as if they were functional. */}
            <div className="settings-widget-card__preview-frame" aria-hidden="true" inert>
              <div
                className={def.chromeless ? 'widget-preview' : 'widget-preview glass-material'}
                style={{
                  width: widthPx,
                  height: heightPx,
                  transform: `scale(${scale})`,
                }}
              >
                <Preview data={def.defaultData} onDataChange={noop} preferences={preferences} />
              </div>
            </div>
            <span className="settings-widget-card__name">{def.displayName}</span>
            <span className="settings-widget-card__add">+ Add</span>
          </div>
        )
      })}
    </div>
  )
}
