import React from 'react'
import type { WeatherDay } from '@/lib/weather/types'


function getWeatherAdvisory(weather: WeatherDay): string | null {
  if (!weather) return null
  if (weather.rainProbability != null && weather.rainProbability >= 60) return 'Likely rain. Bring an umbrella.'
  if (weather.maxTempC != null && weather.maxTempC >= 28) return 'Warmer day, dress light.'
  if (weather.minTempC != null && weather.minTempC <= 12) return 'Cooler day, consider layers.'
  return null
}

export function DayWeatherSummary({ weather }: { weather: WeatherDay }) {
  if (!weather) return null
  const min = weather.minTempC
  const max = weather.maxTempC
  const rain = weather.rainProbability
  const tempDisplay = (typeof min === 'number' && typeof max === 'number')
    ? `${max}°/${min}°`
    : typeof min === 'number'
      ? `${min}°`
      : typeof max === 'number'
        ? `${max}°`
        : 'N/A'
  const rainDisplay = rain != null ? `${rain}% rain` : null
  const advisory = getWeatherAdvisory(weather)

  return (
    <div className="mt-2 mb-2 flex flex-col items-start rounded-xl bg-[var(--brand-primary-soft)] px-3 py-2 text-xs text-[var(--text-strong)]">
      <div className="flex items-center gap-2 font-medium">
        <span className="inline-flex items-center rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
          {weather.conditionLabel}
        </span>
        <span>{tempDisplay}</span>
        {rainDisplay && <span>· {rainDisplay}</span>}
      </div>
      {advisory && (
        <div className="mt-1 text-[var(--text-subtle)]">{advisory}</div>
      )}
    </div>
  )
}
