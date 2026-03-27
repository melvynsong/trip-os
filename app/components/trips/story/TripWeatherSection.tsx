'use client'

import { useEffect, useMemo, useState } from 'react'
import Card from '@/app/components/ui/Card'
import EmptyState from '@/app/components/ui/EmptyState'
import { LoadingSkeleton } from '@/app/components/ui/LoadingSkeleton'
import type { WeatherApiResponse } from '@/lib/weather/types'

type TripWeatherSectionProps = {
  destination: string
  startDate: string
  endDate: string
}

function formatDisplayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function TripWeatherSection({
  destination,
  startDate,
  endDate,
}: TripWeatherSectionProps) {
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
            locationLabel: json.locationLabel,
            summary: json.summary,
            days: json.days || [],
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

  if (loading) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Weather
          </p>
          <LoadingSkeleton className="h-8 w-40" />
        </div>
        <LoadingSkeleton className="h-16 w-full rounded-2xl" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-14 w-full" />
          <LoadingSkeleton className="h-14 w-full" />
          <LoadingSkeleton className="h-14 w-full" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Weather
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-strong)]">Forecast unavailable</h2>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </Card>
    )
  }

  if (!payload || payload.days.length === 0) {
    return (
      <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Weather
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-strong)]">No forecast yet</h2>
        </div>
        <EmptyState
          title={payload?.summary.headline || 'No weather data available'}
          description={
            payload?.summary.note || 'Weather usually appears closer to the travel dates. Try again later.'
          }
          className="p-5"
        />
      </Card>
    )
  }

  return (
    <Card className="space-y-4 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Weather</p>
        <h2 className="text-2xl font-semibold text-[var(--text-strong)]">Trip forecast</h2>
        <p className="text-sm text-[var(--text-subtle)]">{payload.locationLabel}</p>
      </div>

      <div className="rounded-2xl border border-[var(--brand-primary)]/15 bg-[var(--brand-primary-soft)] p-4">
        <p className="text-base font-semibold text-[var(--text-strong)]">{payload.summary.headline}</p>
        {payload.summary.note ? (
          <p className="mt-1 text-sm text-[var(--text-subtle)]">{payload.summary.note}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        {payload.days.map((day) => (
          <div
            key={day.date}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-strong)]">{formatDisplayDate(day.date)}</p>
              <p className="text-xs text-[var(--text-subtle)]">{day.conditionLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {day.maxTempC}° / {day.minTempC}°
              </p>
              <p className="text-xs text-[var(--text-subtle)]">
                {day.rainProbability === null ? 'Rain n/a' : `Rain ${day.rainProbability}%`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}