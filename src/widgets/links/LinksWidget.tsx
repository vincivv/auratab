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
 * Minimal add flow (window.prompt) rather than a polished inline editor —
 * good enough to make the widget functional; refine later if it needs to
 * feel first-class. No favicon fetching (that would be a network call,
 * against NFR-3/NFR-5) — uses a plain initial-letter tile instead.
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
              <span className="widget-links__avatar">{link.label.charAt(0).toUpperCase()}</span>
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
