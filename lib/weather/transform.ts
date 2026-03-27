import { OpenMeteoForecastResponse, WeatherDay, WeatherSummary } from './types'

function clampProbability(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function mapWeatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Cloudy'
  if (code === 45 || code === 48) return 'Fog'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return code >= 80 ? 'Showers' : 'Rain'
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Variable conditions'
}

export function transformOpenMeteoDailyForecast(input: OpenMeteoForecastResponse): WeatherDay[] {
  const daily = input.daily
  const times = daily?.time || []
  const codes = daily?.weather_code || []
  const maxTemps = daily?.temperature_2m_max || []
  const minTemps = daily?.temperature_2m_min || []
  const rainProbs = daily?.precipitation_probability_max || []

  return times.map((date, index) => {
    const conditionCode = Number(codes[index] ?? 0)
    const minTempC = Math.round(Number(minTemps[index] ?? 0))
    const maxTempC = Math.round(Number(maxTemps[index] ?? 0))
    const rainRaw = rainProbs[index]

    return {
      date,
      minTempC,
      maxTempC,
      rainProbability:
        typeof rainRaw === 'number' && Number.isFinite(rainRaw) ? clampProbability(rainRaw) : null,
      conditionCode,
      conditionLabel: mapWeatherCodeToLabel(conditionCode),
    }
  })
}

export function filterForecastByDateRange(days: WeatherDay[], startDate: string, endDate: string) {
  return days.filter((day) => day.date >= startDate && day.date <= endDate)
}

export function buildTripWeatherSummary(days: WeatherDay[]): WeatherSummary {
  if (days.length === 0) {
    return {
      headline: 'Forecast unavailable for these dates',
      note: 'Try checking closer to your trip or confirm your travel dates.',
    }
  }

  const avgMax = days.reduce((sum, day) => sum + day.maxTempC, 0) / days.length
  const avgMin = days.reduce((sum, day) => sum + day.minTempC, 0) / days.length
  const rainyDays = days.filter(
    (day) => (day.rainProbability ?? 0) >= 40 || ['Rain', 'Showers', 'Thunderstorm'].includes(day.conditionLabel)
  ).length

  const headline = avgMax >= 27 ? 'Mostly warm' : avgMax <= 16 ? 'Cooler temperatures ahead' : 'Mostly mild'

  let note: string | null = null

  if (rainyDays > 0) {
    note = 'Rain expected on some days.'
  } else if (avgMin <= 12) {
    note = 'Cool evenings likely.'
  } else if (avgMin <= 16 || avgMax - avgMin >= 10) {
    note = 'Layering recommended.'
  }

  return {
    headline,
    note,
  }
}