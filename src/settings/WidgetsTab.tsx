import { widgetRegistry } from '../widgets/registry'
import { WIDGET_DRAG_MIME } from './widgetDragType'

interface WidgetsTabProps {
  onAddWidget: (type: string) => void
}

/**
 * The widget gallery (FR-13/14), living inside Settings rather than a
 * separate "+" control. Cards are both click-to-add (cascaded default
 * position) and drag-and-drop-able onto the canvas (dropped at the pointer).
 */
export function WidgetsTab({ onAddWidget }: WidgetsTabProps) {
  return (
    <div className="settings-widgets-grid">
      {widgetRegistry.map((def) => (
        <button
          key={def.type}
          type="button"
          className="settings-widget-card"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(WIDGET_DRAG_MIME, def.type)
            e.dataTransfer.effectAllowed = 'copy'
          }}
          onClick={() => onAddWidget(def.type)}
        >
          <span className="settings-widget-card__name">{def.displayName}</span>
          <span className="settings-widget-card__add">+ Add</span>
        </button>
      ))}
    </div>
  )
}
