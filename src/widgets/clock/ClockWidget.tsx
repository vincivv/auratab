import { useEffect, useState } from 'react'
import type { WidgetComponentProps } from '../types'

export function ClockWidget({ preferences }: WidgetComponentProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: preferences.clockFormat === '12h',
  })
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="widget widget--clock">
      <span className="widget-clock__time">{time}</span>
      <span className="widget-clock__date">{date}</span>
    </div>
  )
}
