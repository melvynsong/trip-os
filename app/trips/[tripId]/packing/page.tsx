import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonClass } from '@/app/components/ui/Button'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { getPackingAccessState } from '@/lib/feature-toggles'
import PackingGenerator from '@/app/components/trips/packing/PackingGenerator'
import { geocodeDestination, fetchHistoricalWeather, fetchOpenMeteoDailyForecast } from '@/lib/weather/openMeteo'
import {
  buildPeriodWeatherSummary,
  buildTripWeatherSummary,
  filterForecastByDateRange,
  mergeHistoricalConditions,
  transformArchiveToPeriodConditions,
  transformOpenMeteoDailyForecast,
} from '@/lib/weather/transform'
import { selectWeatherMode, shiftDateRangeByYears } from '@/lib/weather/modeSelector'
import { WeatherProviderError } from '@/lib/weather/types'
import type { PackingWeatherContext } from '@/lib/ai/packing'

type Props = { params: Promise<{ tripId: string }> }

/**
 * Resolve weather context for packing purposes.
 * Returns null silently on any error so packing still works without weather.
 */
async function resolveWeatherContext(
  destination: string,
  startDate: string,
  endDate: string
): Promise<PackingWeatherContext | null> {
  try {
    const modeSelection = selectWeatherMode(startDate)
    const geocoded = await geocodeDestination(destination)

    if (modeSelection.mode === 'forecast') {
      let raw
      try {
        raw = await fetchOpenMeteoDailyForecast(
          geocoded.latitude,
          geocoded.longitude,
          startDate,
          endDate
        )
      } catch (err) {
        if (err instanceof WeatherProviderError && err.code === 'no_forecast_for_dates') {
          return null
        }
        throw err
      }

      const allDays = transformOpenMeteoDailyForecast(raw)
      const days = filterForecastByDateRange(allDays, startDate, endDate)
      const summary = buildTripWeatherSummary(days)

      const maxTemps = days.map((d) => d.maxTempC)
      const minTemps = days.map((d) => d.minTempC)
      const rainyCount = days.filter((d) => (d.rainProbability ?? 0) >= 40).length

      return {
        mode: 'forecast',
        headline: summary.headline,
        note: summary.note,
        avgMaxTempC: maxTemps.length ? Math.round(maxTemps.reduce((a, b) => a + b) / maxTemps.length) : null,
        avgMinTempC: minTemps.length ? Math.round(minTemps.reduce((a, b) => a + b) / minTemps.length) : null,
        rainyDaysPercent: days.length ? Math.round((rainyCount / days.length) * 100) : null,
      }
    }

    // Outlook / climate — use historical data
    const archiveResults = await Promise.allSettled(
      Array.from({ length: modeSelection.historicalYears }, (_, i) => {
        const yearOffset = i + 1
        const { start, end } = shiftDateRangeByYears(startDate, endDate, yearOffset)
        return fetchHistoricalWeather(geocoded.latitude, geocoded.longitude, start, end)
      })
    )

    const conditions = archiveResults
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchHistoricalWeather>>> =>
          r.status === 'fulfilled'
      )
      .map((r) => transformArchiveToPeriodConditions(r.value))
      .filter((c): c is NonNullable<typeof c> => c !== null)

    if (conditions.length === 0) return null

    const merged = mergeHistoricalConditions(conditions)
    const summary = buildPeriodWeatherSummary(merged)

    return {
      mode: modeSelection.mode,
      headline: summary.headline,
      note: summary.note,
      avgMaxTempC: merged.avgMaxTempC,
      avgMinTempC: merged.avgMinTempC,
      rainyDaysPercent: merged.rainyDaysPercent,
    }
  } catch {
    return null
  }
}

export default async function PackingPage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single<{ id: string; title: string; destination: string; start_date: string; end_date: string }>()

  if (tripError || !trip) {
    notFound()
  }

  // Tier gate — server-side guard in addition to API route check
  let membership
  try {
    membership = await getCurrentUserMembership()
  } catch {
    redirect('/')
  }

  const packingAccess = await getPackingAccessState(membership.tier)
  const canUsePacking = packingAccess.canAccess

  // Fetch weather context in parallel with the page load (fire-and-forget if slow)
  const weatherContext = canUsePacking
    ? await resolveWeatherContext(trip.destination, trip.start_date, trip.end_date)
    : null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-5">
        <Link
          href={`/trips/${tripId}`}
          className={buttonClass({
            size: 'sm',
            variant: 'ghost',
            className: 'rounded-full text-[var(--text-strong)] hover:bg-[var(--brand-primary-soft)]',
          })}
        >
          ← {trip.title}
        </Link>
      </div>

      {canUsePacking ? (
        <PackingGenerator
          tripId={tripId}
          tripTitle={trip.title}
          destination={trip.destination}
          weatherContext={weatherContext}
        />
      ) : (
        <div className="rounded-[2rem] border border-[var(--border-soft)] bg-white p-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Packing <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
          </p>
          <h1 className="text-2xl font-serif text-[var(--text-strong)]">
            {packingAccess.hasRequiredTier ? 'Temporarily unavailable' : 'Available for Friends'}
          </h1>
          <p className="text-sm leading-7 text-[var(--text-subtle)] max-w-md mx-auto">
            {packingAccess.hasRequiredTier
              ? 'Packing (Beta) is currently disabled by the admin toggle. Please try again later.'
              : 'AI-powered packing lists are available for Friend and Owner members. Upgrade to get access.'}
          </p>
          <Link
            href="/trips"
            className={buttonClass({
              variant: 'secondary',
              className: 'rounded-full',
            })}
          >
            Back to trips
          </Link>
        </div>
      )}
    </main>
  )
}
