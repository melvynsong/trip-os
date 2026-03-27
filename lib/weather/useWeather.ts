'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WeatherApiResponse } from '@/lib/weather/types'

type UseWeatherOptions = {
  destination: string
  startDate: string
  endDate: string
}

type UseWeatherReturn = {
  loading: boolean
  error: string | null
  payload: WeatherApiResponse | null
}

export function useWeather({
  destination,
  startDate,
  endDate,
}: UseWeatherOptions): UseWeatherReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<WeatherApiResponse | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ destination, startDate, endDate })
    return params.toString()
  }, [destination, startDate, endDate])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/weather?${query}`, { credentials: 'include' })
        const json = (await response.json()) as WeatherApiResponse & { error?: string }

        if (!response.ok) {
          throw new Error(json.error || 'Could not load weather forecast.')
        }

        if (!cancelled) {
          setPayload({
            mode: json.mode ?? 'forecast',
            confidenceLabel: json.confidenceLabel ?? 'Daily forecast',
            contextNote: json.contextNote ?? null,
            locationLabel: json.locationLabel,
            summary: json.summary,
            days: json.days ?? [],
            periodConditions: json.periodConditions ?? null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load weather forecast.')
          setPayload(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [query])

  return { loading, error, payload }
}
