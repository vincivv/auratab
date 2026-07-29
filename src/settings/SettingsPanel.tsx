import { useState } from 'react'
import { GeneralTab } from './GeneralTab'
import { WidgetsTab } from './WidgetsTab'
import { WIDGET_DRAG_MIME } from './widgetDragType'
import type { Preferences } from '../widgets/types'

type SettingsTabId = 'general' | 'widgets'

interface SettingsPanelProps {
  open: boolean
  preferences: Preferences
  onPreferencesChange: (preferences: Preferences) => void
  onAddWidget: (type: string) => void
  onDropWidget: (type: string, clientPos: { x: number; y: number }) => void
  onEnterEditMode: () => void
  onClose: () => void
}

/**
 * Always mounted (rather than conditionally rendered) so `open` can drive a
 * CSS transform transition for the slide-in/out — conditionally mounting
 * would skip the "in" transition entirely on first open.
 *
 * The backdrop (not the canvas) handles the drop: while open, this
 * full-screen overlay sits on top of the canvas in z-order, so a drop on the
 * canvas actually lands here first.
 */
export function SettingsPanel({
  open,
  preferences,
  onPreferencesChange,
  onAddWidget,
  onDropWidget,
  onEnterEditMode,
  onClose,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<SettingsTabId>('general')

  return (
    <div
      className={open ? 'settings-backdrop settings-backdrop--open' : 'settings-backdrop'}
      onClick={onClose}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={(e) => {
        e.preventDefault()
        const type = e.dataTransfer.getData(WIDGET_DRAG_MIME)
        if (!type) return
        onDropWidget(type, { x: e.clientX, y: e.clientY })
        onClose()
      }}
      aria-hidden={!open}
    >
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel__header">
          <span className="settings-panel__title">Settings</span>
          <button type="button" className="settings-panel__close" aria-label="Close settings" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-panel__layout">
          <nav className="settings-nav" role="tablist" aria-orientation="vertical" aria-label="Settings sections">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'general'}
              className={tab === 'general' ? 'settings-nav-item settings-nav-item--active' : 'settings-nav-item'}
              onClick={() => setTab('general')}
            >
              General
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'widgets'}
              className={tab === 'widgets' ? 'settings-nav-item settings-nav-item--active' : 'settings-nav-item'}
              onClick={() => setTab('widgets')}
            >
              Widgets
            </button>
          </nav>

          <div className="settings-panel__body">
            {tab === 'general' ? (
              <GeneralTab preferences={preferences} onPreferencesChange={onPreferencesChange} onEnterEditMode={onEnterEditMode} />
            ) : (
              <WidgetsTab preferences={preferences} onAddWidget={onAddWidget} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
