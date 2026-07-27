import { useState, type FormEvent } from 'react'
import type { SearchEngineId, WidgetComponentProps } from '../types'

/**
 * Hardcoded URL templates, not chrome.search.query — deliberately avoids the
 * `search` permission to keep the manifest permission surface minimal (see
 * CLAUDE.md "Locked-in decisions").
 */
const SEARCH_URL_TEMPLATES: Record<SearchEngineId, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
}

export function SearchWidget({ preferences }: WidgetComponentProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    window.location.href = SEARCH_URL_TEMPLATES[preferences.searchEngine] + encodeURIComponent(trimmed)
  }

  return (
    <form className="widget widget--search" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${preferences.searchEngine}`}
        aria-label="Search the web"
      />
    </form>
  )
}
