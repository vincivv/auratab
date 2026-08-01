import { useState } from 'react'
import type { WidgetComponentProps } from '../types'

interface LinkItem {
  id: string
  label: string
  url: string
}

interface LinksData extends Record<string, unknown> {
  links?: LinkItem[]
}

/**
 * Real site favicons via Google's public favicon endpoint (no API key, no
 * backend — see CLAUDE.md's "Network calls" entry for the full reasoning
 * and why this is different from the earlier offline-only stance). Falls
 * back to an initial-letter tile if the request fails (offline, endpoint
 * down, or the URL isn't parseable) rather than a broken image icon.
 */
function LinkIcon({ url, label }: { url: string; label: string }) {
  const [failed, setFailed] = useState(false)

  let domain: string | null = null
  try {
    domain = new URL(url).hostname
  } catch {
    domain = null
  }

  if (failed || !domain) {
    return <span className="widget-links__avatar">{label.charAt(0).toUpperCase()}</span>
  }

  return (
    <img
      className="widget-links__favicon"
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Minimal add flow (window.prompt) rather than a polished inline editor —
 * good enough to make the widget functional; refine later if it needs to
 * feel first-class.
 */
export function LinksWidget({ data, onDataChange }: WidgetComponentProps<LinksData>) {
  const links = data.links ?? []

  const addLink = () => {
    const url = window.prompt('Link URL (e.g. https://example.com)')
    if (!url) return
    let hostname = url
    try {
      hostname = new URL(url).hostname
    } catch {
      // not a fully-qualified URL — fall back to using it as-is
    }
    const label = window.prompt('Label', hostname) ?? hostname
    onDataChange({ ...data, links: [...links, { id: crypto.randomUUID(), label, url }] })
  }

  const removeLink = (id: string) => {
    onDataChange({ ...data, links: links.filter((link) => link.id !== id) })
  }

  return (
    <div className="widget widget--links">
      <div className="widget-links__grid">
        {links.map((link) => (
          <div key={link.id} className="widget-links__tile-wrap">
            <a className="widget-links__tile" href={link.url} target="_blank" rel="noreferrer">
              <LinkIcon url={link.url} label={link.label} />
              <span className="widget-links__label">{link.label}</span>
            </a>
            <button
              type="button"
              className="widget-links__remove"
              aria-label={`Remove ${link.label}`}
              onClick={() => removeLink(link.id)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="widget-links__add" onClick={addLink}>
          +
        </button>
      </div>
    </div>
  )
}
