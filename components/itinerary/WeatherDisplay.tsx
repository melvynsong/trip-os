import React from 'react'
import { WeatherDay } from '@/lib/weather/weather-service'

export function WeatherDisplay({ weather }: { weather: WeatherDay }) {
  if (!weather) return null
  const reliabilityLabel = {
    high: null,
    medium: <span className="text-xs text-muted">forecast</span>,
    low: <span className="text-xs text-muted">estimate</span>,
  }[weather.reliability]

  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      {/* Replace with your icon logic */}
      <span>{/* <WeatherIcon condition={weather.condition} /> */}</span>
      <span>{weather.temperature_min}–{weather.temperature_max}°C</span>
      <span>{weather.condition}</span>
      {reliabilityLabel && <span className="ml-1">{reliabilityLabel}</span>}
    </div>
  )
}
