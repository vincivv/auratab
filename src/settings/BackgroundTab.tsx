import { useRef, useState, type ChangeEvent } from 'react'
import { backgroundPresets } from '../backgrounds/presets'
import { validateBackgroundImage } from '../backgrounds/media/uploadValidation'
import { saveCustomBackground, clearCustomBackground } from '../backgrounds/media/backgroundMediaStore'
import type { Preferences } from '../widgets/types'

interface BackgroundTabProps {
  preferences: Preferences
  onPreferencesChange: (preferences: Preferences) => void
}

export function BackgroundTab({ preferences, onPreferencesChange }: BackgroundTabProps) {
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectPreset = (id: string) => {
    setError(null)
    onPreferencesChange({ ...preferences, background: { type: 'preset', id } })
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validationError = validateBackgroundImage(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    await saveCustomBackground(file)
    onPreferencesChange({ ...preferences, background: { type: 'custom', updatedAt: Date.now() } })
  }

  const removeCustom = async () => {
    await clearCustomBackground()
    onPreferencesChange({ ...preferences, background: { type: 'preset', id: backgroundPresets[0].id } })
  }

  return (
    <div className="settings-background">
      <div className="settings-field">
        <span>Preset</span>
        <div className="settings-background__swatches">
          {backgroundPresets.map((preset) => {
            const active = preferences.background.type === 'preset' && preferences.background.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                className={active ? 'settings-background__swatch settings-background__swatch--active' : 'settings-background__swatch'}
                style={{ background: preset.css }}
                onClick={() => selectPreset(preset.id)}
                aria-label={preset.name}
                aria-pressed={active}
              />
            )
          })}
        </div>
      </div>

      <div className="settings-field">
        <span>Custom image</span>
        <div className="settings-background__upload">
          <button type="button" className="settings-action" onClick={() => fileInputRef.current?.click()}>
            Upload image
          </button>
          {preferences.background.type === 'custom' && (
            <button type="button" className="settings-action settings-action--danger" onClick={removeCustom}>
              Remove
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
        {error && <span className="settings-background__error">{error}</span>}
      </div>
    </div>
  )
}
