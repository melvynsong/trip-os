'use client'

import { WeatherProvider } from './WeatherContext'
import { useWeather } from '@/lib/weather/useWeather'

type WeatherDataProviderProps = {
  destination: string
  startDate: string
  endDate: string
  children: React.ReactNode
}

/**
 * Fetches weather data and provides it to child components via context.
 * This allows TripWeatherSection and DayWeather to share the same data without double-fetching.
 */
export function WeatherDataProvider({
  destination,
  startDate,
  endDate,
  children,
}: WeatherDataProviderProps) {
  const { payload } = useWeather({
    destination,
    startDate,
    endDate,
  })

  return (
    <WeatherProvider weatherData={payload}>
      {children}
    </WeatherProvider>
  )
}
