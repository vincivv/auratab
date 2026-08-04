import { useEffect, useState, type CSSProperties } from 'react'
import { backgroundPresets } from './presets'
import { loadCustomBackground } from './media/backgroundMediaStore'
import type { BackgroundSelection } from './types'

/**
 * Resolves the persisted BackgroundSelection into real CSS for .canvas.
 * Presets are synchronous (just a lookup); 'custom' needs an async
 * IndexedDB read for the blob, so this returns {} (falls through to
 * .canvas's own hardcoded gradient fallback in global.css) until that
 * resolves — avoids a flash of black while it loads.
 */
export function useBackgroundStyle(selection: BackgroundSelection): CSSProperties {
  const [customUrl, setCustomUrl] = useState<string | null>(null)

  useEffect(() => {
    if (selection.type !== 'custom') return
    let cancelled = false
    let objectUrl: string | null = null

    loadCustomBackground().then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setCustomUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // Keyed on updatedAt (not just selection.type) so re-uploading over an
    // already-active custom background re-reads IndexedDB instead of
    // silently keeping the previous object URL — see the doc comment on
    // BackgroundSelection in types.ts.
  }, [selection.type, selection.type === 'custom' ? selection.updatedAt : null])

  if (selection.type === 'custom') {
    if (!customUrl) return {}
    return { backgroundImage: `url(${customUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }

  const preset = backgroundPresets.find((p) => p.id === selection.id) ?? backgroundPresets[0]
  return { background: preset.css }
}
