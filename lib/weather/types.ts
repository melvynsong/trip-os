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

export type WeatherDay = {
  date: string
  minTempC: number
  maxTempC: number
  rainProbability: number | null
  conditionCode: number
  conditionLabel: string
}

export type WeatherSummary = {
  headline: string
  note: string | null
}

export type WeatherForecastResult = {
  locationLabel: string
  summary: WeatherSummary
  days: WeatherDay[]
}

export type WeatherApiResponse = WeatherForecastResult

export class WeatherProviderError extends Error {
  code: 'destination_not_found' | 'fetch_failed' | 'malformed_response'

  constructor(code: 'destination_not_found' | 'fetch_failed' | 'malformed_response', message: string) {
    super(message)
    this.code = code
    this.name = 'WeatherProviderError'
  }
}