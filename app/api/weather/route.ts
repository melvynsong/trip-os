import { NextResponse } from 'next/server'
import { fetchOpenMeteoDailyForecast, geocodeDestination } from '@/lib/weather/openMeteo'
import {
  buildTripWeatherSummary,
  filterForecastByDateRange,
  transformOpenMeteoDailyForecast,
} from '@/lib/weather/transform'
import { WeatherProviderError } from '@/lib/weather/types'

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

function buildEmptyWeatherResponse(locationLabel: string, headline: string, note: string) {
  return {
    locationLabel,
    summary: {
      headline,
      note,
    },
    days: [],
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = String(searchParams.get('destination') || '').trim()
    const startDate = String(searchParams.get('startDate') || '').trim()
    const endDate = String(searchParams.get('endDate') || '').trim()

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

    const geocoded = await geocodeDestination(destination)
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
          buildEmptyWeatherResponse(
            buildLocationLabel(geocoded.name, geocoded.region, geocoded.country),
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

    return NextResponse.json({
      locationLabel: buildLocationLabel(geocoded.name, geocoded.region, geocoded.country),
      summary,
      days,
    })
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      if (error.code === 'destination_not_found') {
        return NextResponse.json(
          buildEmptyWeatherResponse(
            'Unknown destination',
            'Forecast unavailable for this destination',
            'Try using a city or country name, for example “Tokyo, Japan”.'
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