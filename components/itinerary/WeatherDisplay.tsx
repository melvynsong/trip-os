import React from 'react'
import { WeatherDay } from '@/lib/weather/weather-service'

export function WeatherDisplay({ weather }: { weather: WeatherDay }) {
  if (!weather) return null
  // Debug log for temperature values
  if (typeof window !== 'undefined') {
    // Only log in browser
    // eslint-disable-next-line no-console
    console.info('[WeatherDisplay] WeatherDay:', weather)
  }
  const reliabilityLabel = {
    high: null,
    medium: <span className="text-xs text-muted">forecast</span>,
    low: <span className="text-xs text-muted">estimate</span>,
  }[weather.reliability]

  const min = weather.temperature_min
  const max = weather.temperature_max
  let tempDisplay = 'N/A'
  if (typeof min === 'number' && typeof max === 'number') {
    tempDisplay = `${min}–${max}°C`
  } else if (typeof min === 'number') {
    tempDisplay = `${min}°C`
  } else if (typeof max === 'number') {
    tempDisplay = `${max}°C`
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      {/* Replace with your icon logic */}
      <span>{/* <WeatherIcon condition={weather.condition} /> */}</span>
      <span>{tempDisplay}</span>
      <span>{weather.condition}</span>
      {reliabilityLabel && <span className="ml-1">{reliabilityLabel}</span>}
    </div>
  )
}
