import {
  OpenMeteoArchiveResponse,
  OpenMeteoForecastResponse,
  OpenMeteoGeocodeResponse,
  WeatherGeocodeResult,
  WeatherProviderError,
} from './types'

const OPEN_METEO_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

function buildDestinationCandidates(destination: string) {
  const normalized = destination.trim().replace(/\s+/g, ' ')
  if (!normalized) return []

  const candidates = new Set<string>([normalized])

  const withoutParentheses = normalized.replace(/\([^)]*\)/g, '').trim()
  if (withoutParentheses) candidates.add(withoutParentheses)

  const separatorParts = withoutParentheses
    .split(/\s*(?:\||·|\/|→|->|&|\+)\s*/g)
    .map((part) => part.trim())
    .filter(Boolean)

  if (separatorParts[0]) candidates.add(separatorParts[0])

  const toParts = withoutParentheses
    .split(/\s+to\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
  if (toParts[0]) candidates.add(toParts[0])

  return Array.from(candidates)
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new WeatherProviderError('fetch_failed', 'Unable to reach weather service right now.')
  }

  if (!response.ok) {
    if (response.status === 400) {
      const bodyText = await response.text().catch(() => '')
      const normalized = bodyText.toLowerCase()
      if (
        normalized.includes('date range') ||
        normalized.includes('forecast_days') ||
        normalized.includes('out of allowed range') ||
        normalized.includes('invalid date')
      ) {
        throw new WeatherProviderError(
          'no_forecast_for_dates',
          'Forecast is unavailable for the requested date range.'
        )
      }
    }

    throw new WeatherProviderError('fetch_failed', 'Weather service returned an unexpected response.')
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new WeatherProviderError('malformed_response', 'Weather service returned invalid JSON.')
  }
}

export async function geocodeDestination(destination: string): Promise<WeatherGeocodeResult> {
  const candidateDestinations = buildDestinationCandidates(destination)
  if (candidateDestinations.length === 0) {
    throw new WeatherProviderError('destination_not_found', 'Destination is required.')
  }

  for (const candidate of candidateDestinations) {
    const searchParams = new URLSearchParams({
      name: candidate,
      count: '3',
      language: 'en',
      format: 'json',
    })

    const payload = await fetchJson<OpenMeteoGeocodeResponse>(
      `${OPEN_METEO_GEOCODE_URL}?${searchParams.toString()}`
    )

    const first = payload.results?.[0]
    if (!first) {
      continue
    }

    if (
      typeof first.name !== 'string' ||
      typeof first.latitude !== 'number' ||
      typeof first.longitude !== 'number'
    ) {
      throw new WeatherProviderError('malformed_response', 'Weather geocoding response is malformed.')
    }

    return {
      name: first.name,
      latitude: first.latitude,
      longitude: first.longitude,
      country: first.country ?? null,
      region: first.admin1 ?? null,
      timezone: first.timezone ?? null,
    }
  }

  throw new WeatherProviderError('destination_not_found', 'We could not find that destination.')
}

export async function fetchOpenMeteoDailyForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<OpenMeteoForecastResponse> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
    ].join(','),
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  })

  const payload = await fetchJson<OpenMeteoForecastResponse>(
    `${OPEN_METEO_FORECAST_URL}?${query.toString()}`
  )

  const daily = payload.daily
  const times = daily?.time
  const codes = daily?.weather_code
  const maxTemps = daily?.temperature_2m_max
  const minTemps = daily?.temperature_2m_min

  if (!daily || !Array.isArray(times) || !Array.isArray(codes) || !Array.isArray(maxTemps) || !Array.isArray(minTemps)) {
    throw new WeatherProviderError('malformed_response', 'Weather forecast response is malformed.')
  }

  if (times.length !== codes.length || times.length !== maxTemps.length || times.length !== minTemps.length) {
    throw new WeatherProviderError('malformed_response', 'Weather forecast arrays are inconsistent.')
  }

  return payload
}

const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

/**
 * Fetch historical daily weather from the Open-Meteo archive endpoint.
 * Used for outlook and climate modes to derive typical conditions based on
 * the same time period in previous year(s).
 *
 * Note: the archive dataset lags ~5 days behind present.
 */
export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<OpenMeteoArchiveResponse> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
    ].join(','),
    timezone: 'UTC',
    start_date: startDate,
    end_date: endDate,
  })

  const payload = await fetchJson<OpenMeteoArchiveResponse>(
    `${OPEN_METEO_ARCHIVE_URL}?${query.toString()}`
  )

  const daily = payload.daily
  if (!daily || !Array.isArray(daily.time)) {
    throw new WeatherProviderError('malformed_response', 'Historical weather response is malformed.')
  }

  return payload
}