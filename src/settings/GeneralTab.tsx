import type { Preferences } from '../widgets/types'

interface GeneralTabProps {
  preferences: Preferences
  onPreferencesChange: (preferences: Preferences) => void
  onEnterEditMode: () => void
  onResetLayout: () => void
}

export function GeneralTab({ preferences, onPreferencesChange, onEnterEditMode, onResetLayout }: GeneralTabProps) {
  return (
    <div className="settings-general">
      <button type="button" className="settings-action" onClick={onEnterEditMode}>
        Edit widgets
      </button>

      <button type="button" className="settings-action settings-action--danger" onClick={onResetLayout}>
        Reset to default layout
      </button>

      <label className="settings-field">
        <span>Motion</span>
        <select
          value={preferences.reducedMotion}
          onChange={(e) =>
            onPreferencesChange({ ...preferences, reducedMotion: e.target.value as Preferences['reducedMotion'] })
          }
        >
          <option value="auto">Auto (match system)</option>
          <option value="on">Reduced</option>
          <option value="off">Full motion</option>
        </select>
      </label>

      <label className="settings-field">
        <span>Clock format</span>
        <select
          value={preferences.clockFormat}
          onChange={(e) => onPreferencesChange({ ...preferences, clockFormat: e.target.value as Preferences['clockFormat'] })}
        >
          <option value="12h">12-hour</option>
          <option value="24h">24-hour</option>
        </select>
      </label>

      <label className="settings-field">
        <span>Widget transparency</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={preferences.widgetTransparency}
          onChange={(e) => onPreferencesChange({ ...preferences, widgetTransparency: Number(e.target.value) })}
        />
      </label>

      <label className="settings-field">
        <span>Clock color</span>
        <input
          type="color"
          value={preferences.clockColor}
          onChange={(e) => onPreferencesChange({ ...preferences, clockColor: e.target.value })}
        />
      </label>

      <label className="settings-field">
        <span>Search engine</span>
        <select
          value={preferences.searchEngine}
          onChange={(e) =>
            onPreferencesChange({ ...preferences, searchEngine: e.target.value as Preferences['searchEngine'] })
          }
        >
          <option value="google">Google</option>
          <option value="bing">Bing</option>
          <option value="duckduckgo">DuckDuckGo</option>
        </select>
      </label>
    </div>
  )
}
