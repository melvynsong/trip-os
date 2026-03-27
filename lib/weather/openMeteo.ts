import {
  OpenMeteoForecastResponse,
  OpenMeteoGeocodeResponse,
  WeatherGeocodeResult,
  WeatherProviderError,
} from './types'

const OPEN_METEO_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

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
    throw new WeatherProviderError('fetch_failed', 'Weather service returned an unexpected response.')
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new WeatherProviderError('malformed_response', 'Weather service returned invalid JSON.')
  }
}

export async function geocodeDestination(destination: string): Promise<WeatherGeocodeResult> {
  const normalizedDestination = destination.trim()
  if (!normalizedDestination) {
    throw new WeatherProviderError('destination_not_found', 'Destination is required.')
  }

  const searchParams = new URLSearchParams({
    name: normalizedDestination,
    count: '1',
    language: 'en',
    format: 'json',
  })

  const payload = await fetchJson<OpenMeteoGeocodeResponse>(
    `${OPEN_METEO_GEOCODE_URL}?${searchParams.toString()}`
  )

  const first = payload.results?.[0]
  if (!first) {
    throw new WeatherProviderError('destination_not_found', 'We could not find that destination.')
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