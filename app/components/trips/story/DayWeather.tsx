'use client'

import { useContext } from 'react'
import { WeatherContext } from './WeatherContext'

type DayWeatherProps = {
  date: string
  compact?: boolean
}

/**
 * Displays weather context for a specific date inside a DaySection card.
 *
 * - In forecast mode: shows the day's condition and temperature.
 * - In outlook/climate modes: shows a short note that daily precision is not
 *   available, so users are not misled by fabricated per-day figures.
 * - Renders nothing if no weather data is loaded yet.
 */
export function DayWeather({ date, compact = false }: DayWeatherProps) {
  const weatherPayload = useContext(WeatherContext)

  if (!weatherPayload) return null

  const { mode, periodConditions } = weatherPayload

  // -- Non-forecast modes: show a lightweight contextual note only --
  if (mode === 'outlook' || mode === 'climate') {
    if (!periodConditions) return null

    const label = mode === 'outlook' ? 'Early outlook' : 'Typical'
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {label}
        </span>
        <span>
          {periodConditions.avgMaxTempC}° / {periodConditions.avgMinTempC}°
          {' · '}
          {periodConditions.typicalCondition}
        </span>
      </div>
    )
  }

  // -- Forecast mode: show the specific day's data if available --
  const dayWeather = weatherPayload.days.find((d) => d.date === date)
  if (!dayWeather) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
        <span className="font-medium">{dayWeather.conditionLabel}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span>
          {dayWeather.maxTempC}° / {dayWeather.minTempC}°
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-strong)]">{dayWeather.conditionLabel}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-sm font-semibold text-[var(--text-strong)]">{dayWeather.maxTempC}°</p>
          <p className="text-xs text-[var(--text-subtle)]">{dayWeather.minTempC}°</p>
        </div>
      </div>
      {dayWeather.rainProbability !== null && (
        <p className="mt-1.5 text-xs text-[var(--text-subtle)]">
          {dayWeather.rainProbability}% chance of rain
        </p>
      )}
    </div>
  )
}
