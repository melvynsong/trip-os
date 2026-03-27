export type WeatherGeocodeResult = {
  name: string
  latitude: number
  longitude: number
  country: string | null
  region: string | null
  timezone: string | null
}

export type OpenMeteoGeocodeResponse = {
  results?: Array<{
    name?: string
    latitude?: number
    longitude?: number
    country?: string
    admin1?: string
    timezone?: string
  }>
}

export type OpenMeteoForecastResponse = {
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: Array<number | null>
  }
}

/** Shape returned by Open-Meteo archive endpoint (no precipitation_probability). */
export type OpenMeteoArchiveResponse = {
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_sum?: Array<number | null>
  }
}

export type WeatherDay = {
  date: string
  minTempC: number
  maxTempC: number
  rainProbability: number | null
  conditionCode: number
  conditionLabel: string
}

/**
 * Aggregate summary used for outlook and climate modes where we do not have
 * reliable day-by-day data.
 */
export type WeatherPeriodConditions = {
  avgMinTempC: number
  avgMaxTempC: number
  typicalCondition: string
  rainyDaysPercent: number
}

export type WeatherSummary = {
  headline: string
  note: string | null
}

/**
 * Which data quality mode the weather response was generated in.
 * - forecast  Real daily forecast — trip within 16 days.
 * - outlook   Early-range estimate — trip 17–90 days away; derived from historical
 *             data for the same time of year.
 * - climate   Typical conditions — trip beyond 90 days; multi-year historical mean.
 */
export type WeatherMode = 'forecast' | 'outlook' | 'climate'

export type WeatherApiResponse = {
  mode: WeatherMode
  /** Short, human-readable label for the mode, e.g. "Daily forecast" */
  confidenceLabel: string
  /**
   * Explanation shown when the mode is not forecast, so users understand
   * they are not seeing day-by-day precision.
   */
  contextNote: string | null
  locationLabel: string
  summary: WeatherSummary
  /** Populated only in forecast mode. */
  days: WeatherDay[]
  /** Populated only in outlook and climate modes. */
  periodConditions: WeatherPeriodConditions | null
}

export class WeatherProviderError extends Error {
  code: 'destination_not_found' | 'fetch_failed' | 'malformed_response' | 'no_forecast_for_dates'

  constructor(
    code: 'destination_not_found' | 'fetch_failed' | 'malformed_response' | 'no_forecast_for_dates',
    message: string
  ) {
    super(message)
    this.code = code
    this.name = 'WeatherProviderError'
  }
}