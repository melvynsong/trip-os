'use client'

import { createContext } from 'react'
import type { WeatherApiResponse } from '@/lib/weather/types'

export const WeatherContext = createContext<WeatherApiResponse | null>(null)

export function WeatherProvider({
  children,
  weatherData,
}: {
  children: React.ReactNode
  weatherData: WeatherApiResponse | null
}) {
  return (
    <WeatherContext.Provider value={weatherData}>
      {children}
    </WeatherContext.Provider>
  )
}
