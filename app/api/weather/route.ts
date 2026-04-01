import { NextResponse } from 'next/server'
import { fetchHistoricalWeather, fetchOpenMeteoDailyForecast, geocodeDestination } from '@/lib/weather/openMeteo'
import {
  buildPeriodWeatherSummary,
  buildTripWeatherSummary,
  filterForecastByDateRange,
  mergeHistoricalConditions,
  transformArchiveToPeriodConditions,
  transformOpenMeteoDailyForecast,
} from '@/lib/weather/transform'
import { selectWeatherMode, shiftDateRangeByYears } from '@/lib/weather/modeSelector'
import { WeatherApiResponse, WeatherProviderError } from '@/lib/weather/types'

export const runtime = 'nodejs'

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toTime(value: string) {
  return new Date(`${value}T00:00:00Z`).getTime()
}

function buildLocationLabel(name: string, region: string | null, country: string | null) {
  return [name, region, country].filter(Boolean).join(', ')
}

function emptyResponse(
  locationLabel: string,
  headline: string,
  note: string
): WeatherApiResponse {
  return {
    mode: 'forecast',
    confidenceLabel: 'Daily forecast',
    contextNote: null,
    locationLabel,
    summary: { headline, note },
    days: [],
    periodConditions: null,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = String(searchParams.get('destination') || '').trim()
    const startDate = String(searchParams.get('startDate') || '').trim()
    const endDate = String(searchParams.get('endDate') || '').trim()

    // Debug: Log incoming weather API request
    console.info('[WeatherAPI] Request:', { destination, startDate, endDate })

    if (!destination) {
      return NextResponse.json({ error: 'Destination is required.' }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required.' }, { status: 400 })
    }

    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      return NextResponse.json({ error: 'Dates must be in YYYY-MM-DD format.' }, { status: 400 })
    }

    const startTime = toTime(startDate)
    const endTime = toTime(endDate)

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      return NextResponse.json({ error: 'Please provide valid dates.' }, { status: 400 })
    }

    if (startTime > endTime) {
      return NextResponse.json({ error: 'Start date must be before end date.' }, { status: 400 })
    }

    const modeSelection = selectWeatherMode(startDate)
    let geocoded
    try {
      geocoded = await geocodeDestination(destination)
    } catch (err) {
      // Debug: Log geocoding failure
      console.error('[WeatherAPI] Geocoding failed:', { destination, error: err })
      if (err instanceof WeatherProviderError && err.code === 'destination_not_found') {
        return NextResponse.json({ error: 'Could not find that destination.' }, { status: 404 })
      }
      throw err
    }
    const locationLabel = buildLocationLabel(geocoded.name, geocoded.region, geocoded.country)

    // ------------------------------------------------------------------
    // FORECAST mode — real daily weather from Open-Meteo forecast API
    // ------------------------------------------------------------------
    if (modeSelection.mode === 'forecast') {
      let rawForecast

      try {
        rawForecast = await fetchOpenMeteoDailyForecast(
          geocoded.latitude,
          geocoded.longitude,
          startDate,
          endDate
        )
      } catch (error) {
        if (error instanceof WeatherProviderError && error.code === 'no_forecast_for_dates') {
          return NextResponse.json(
            emptyResponse(
              locationLabel,
              'Forecast unavailable for these dates',
              'Try checking closer to your trip or confirm your travel dates.'
            )
          )
        }
        throw error
      }

      const transformedDays = transformOpenMeteoDailyForecast(rawForecast)
      const days = filterForecastByDateRange(transformedDays, startDate, endDate)
      const summary = buildTripWeatherSummary(days)

      const response: WeatherApiResponse = {
        mode: 'forecast',
        confidenceLabel: modeSelection.confidenceLabel,
        contextNote: null,
        locationLabel,
        summary,
        days,
        periodConditions: null,
      }
      return NextResponse.json(response)
    }

    // ------------------------------------------------------------------
    // OUTLOOK / CLIMATE modes — derive typical conditions from historical
    // data for the same time period in previous year(s).
    // ------------------------------------------------------------------
    const yearsToFetch = modeSelection.historicalYears
    const archiveResults = await Promise.allSettled(
      Array.from({ length: yearsToFetch }, (_, i) => {
        const yearOffset = i + 1
        const { start, end } = shiftDateRangeByYears(startDate, endDate, yearOffset)
        return fetchHistoricalWeather(geocoded.latitude, geocoded.longitude, start, end)
      })
    )

    const periodConditionsList = archiveResults
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchHistoricalWeather>>> =>
          r.status === 'fulfilled'
      )
      .map((r) => transformArchiveToPeriodConditions(r.value))
      .filter((c): c is NonNullable<typeof c> => c !== null)

    if (periodConditionsList.length === 0) {
      return NextResponse.json(
        emptyResponse(
          locationLabel,
          'Typical conditions unavailable',
          'We could not retrieve historical data for this destination right now.'
        )
      )
    }

    const periodConditions = mergeHistoricalConditions(periodConditionsList)
    const summary = buildPeriodWeatherSummary(periodConditions)

    const response: WeatherApiResponse = {
      mode: modeSelection.mode,
      confidenceLabel: modeSelection.confidenceLabel,
      contextNote: modeSelection.contextNote,
      locationLabel,
      summary,
      days: [],
      periodConditions,
    }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      if (error.code === 'destination_not_found') {
        return NextResponse.json(
          emptyResponse(
            'Unknown destination',
            'Forecast unavailable for this destination',
            'Try using a city or country name, for example "Tokyo, Japan".'
          )
        )
      }

      const status = error.code === 'malformed_response' ? 502 : 503
      return NextResponse.json(
        { error: 'Weather is temporarily unavailable. Please try again shortly.' },
        { status }
      )
    }

    return NextResponse.json(
      { error: 'Unexpected weather error. Please try again shortly.' },
      { status: 500 }
    )
  }
}
