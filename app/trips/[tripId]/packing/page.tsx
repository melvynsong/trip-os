import { GeneratePackingListButton } from '@/components/itinerary/GeneratePackingListButton'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonClass } from '@/app/components/ui/Button'
import TripHeader from '@/app/components/trips/TripHeader'
import TripPageShell from '@/app/components/trips/TripPageShell'
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

type Props = { params: { tripId: string } }

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
  const { tripId } = params
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

  // Extra debug output at the top of the page
  console.log('[PackingPage][DEBUG]', {
    tripId,
    userId: user?.id,
    trip,
    tripError,
    membership,
    packingAccess,
    canUsePacking,
  })

  return (
    <TripPageShell className="max-w-3xl space-y-6">
      {/* Extra debug info always visible for troubleshooting */}
      <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs text-left">
        <strong>Debug Info:</strong>
        <ul className="mt-1 space-y-1">
          <li><b>tripId:</b> {tripId}</li>
          <li><b>User:</b> {user?.id || 'none (not logged in)'}</li>
          <li><b>Trip:</b> {trip?.id || 'none (not found or not owner)'}</li>
          <li><b>Membership tier:</b> {membership?.tier || 'unknown'}</li>
          <li><b>packingAccess.canAccess:</b> {String(packingAccess.canAccess)}</li>
          <li><b>packingAccess.hasRequiredTier:</b> {String(packingAccess.hasRequiredTier)}</li>
        </ul>
      </div>
      <TripHeader
        dateRange={`${trip.start_date} → ${trip.end_date}`}
        title="Packing"
        subtitle={`${trip.title} · ${trip.destination}`}
        backHref={`/trips/${tripId}`}
        backLabel="Back to Trip"
      />

      {canUsePacking ? (
        <>
          <PackingGenerator
            tripId={tripId}
            tripTitle={trip.title}
            destination={trip.destination}
            weatherContext={weatherContext}
          />
          <div className="mt-6">
            <GeneratePackingListButton tripId={tripId} />
          </div>
        </>
      ) : (
        <div className="rounded-[2rem] border border-[var(--border-soft)] bg-white p-8 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">

            // This page is now redundant and intentionally left empty for safe removal.
          </p>
