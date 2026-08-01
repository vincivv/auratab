import { useEffect, useState, type FormEvent } from 'react'
import type { WidgetComponentProps } from '../types'

interface WeatherData extends Record<string, unknown> {
  city?: string
}

interface WeatherSnapshot {
  temperature: number
  weatherCode: number
  resolvedName: string
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; snapshot: WeatherSnapshot }

const REFRESH_INTERVAL_MS = 15 * 60 * 1000

const WEATHER_CODE_INFO: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: 'Clear' },
  1: { icon: '🌤️', label: 'Mostly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌦️', label: 'Heavy drizzle' },
  61: { icon: '🌧️', label: 'Light rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  71: { icon: '🌨️', label: 'Light snow' },
  73: { icon: '🌨️', label: 'Snow' },
  75: { icon: '🌨️', label: 'Heavy snow' },
  80: { icon: '🌦️', label: 'Rain showers' },
  81: { icon: '🌧️', label: 'Rain showers' },
  82: { icon: '⛈️', label: 'Violent showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm' },
  99: { icon: '⛈️', label: 'Thunderstorm' },
}

function describeWeatherCode(code: number) {
  return WEATHER_CODE_INFO[code] ?? { icon: '🌡️', label: 'Unknown' }
}

/**
 * Open-Meteo — free, no API key (nothing to hide/leak in client-side
 * extension code), CORS-enabled for direct browser fetches. This is the
 * one deliberate NFR-5 exception in the app — see CLAUDE.md.
 */
async function fetchWeatherForCity(city: string): Promise<WeatherSnapshot> {
  const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`)
  if (!geoRes.ok) throw new Error('Location lookup failed')
  const geo = await geoRes.json()
  const place = geo?.results?.[0]
  if (!place) throw new Error(`Couldn't find "${city}"`)

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
  )
  if (!forecastRes.ok) throw new Error('Weather lookup failed')
  const forecast = await forecastRes.json()
  const current = forecast?.current
  if (!current) throw new Error('No weather data returned')

  return {
    temperature: Math.round(current.temperature_2m),
    weatherCode: current.weather_code,
    resolvedName: [place.name, place.admin1, place.country_code].filter(Boolean).join(', '),
  }
}

export function WeatherWidget({ data, onDataChange }: WidgetComponentProps<WeatherData>) {
  const city = data.city ?? ''
  const [cityInput, setCityInput] = useState('')
  const [state, setState] = useState<FetchState>({ status: 'idle' })

  useEffect(() => {
    if (!city) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false

    const load = () => {
      setState({ status: 'loading' })
      fetchWeatherForCity(city)
        .then((snapshot) => {
          if (!cancelled) setState({ status: 'ready', snapshot })
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setState({ status: 'error', message: err instanceof Error ? err.message : 'Weather lookup failed' })
          }
        })
    }

    load()
    const id = window.setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [city])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = cityInput.trim()
    if (!trimmed) return
    onDataChange({ ...data, city: trimmed })
  }

  const handleChangeCity = () => {
    const { city: _unused, ...rest } = data
    onDataChange(rest)
    setCityInput('')
  }

  if (!city) {
    return (
      <form className="widget widget--weather-setup" onSubmit={handleSubmit}>
        <span className="widget-weather__prompt">Add a city for weather</span>
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="City name"
          aria-label="City for weather"
        />
        <button type="submit">Set</button>
      </form>
    )
  }

  return (
    <div className="widget widget--weather">
      <button type="button" className="widget-weather__change" onClick={handleChangeCity} aria-label="Change city">
        ✎
      </button>

      {state.status === 'loading' && <span className="widget-weather__status">Loading…</span>}
      {state.status === 'error' && (
        <span className="widget-weather__status widget-weather__status--error">{state.message}</span>
      )}
      {state.status === 'ready' && (
        <>
          <span className="widget-weather__icon">{describeWeatherCode(state.snapshot.weatherCode).icon}</span>
          <span className="widget-weather__temp">{state.snapshot.temperature}°F</span>
          <span className="widget-weather__condition">{describeWeatherCode(state.snapshot.weatherCode).label}</span>
          <span className="widget-weather__place">{state.snapshot.resolvedName}</span>
        </>
      )}
    </div>
  )
}
