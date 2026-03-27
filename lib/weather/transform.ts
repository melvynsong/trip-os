import {
  OpenMeteoArchiveResponse,
  OpenMeteoForecastResponse,
  WeatherDay,
  WeatherPeriodConditions,
  WeatherSummary,
} from './types'

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

// ---------------------------------------------------------------------------
// Period-conditions helpers (used for outlook + climate modes)
// ---------------------------------------------------------------------------

/**
 * Transform one year's archive data into aggregate period conditions.
 * Returns null if the archive response has no usable daily data.
 */
export function transformArchiveToPeriodConditions(
  input: OpenMeteoArchiveResponse
): WeatherPeriodConditions | null {
  const daily = input.daily
  const times = daily?.time || []
  if (times.length === 0) return null

  const codes = daily?.weather_code || []
  const maxTemps = daily?.temperature_2m_max || []
  const minTemps = daily?.temperature_2m_min || []
  const precipSums = daily?.precipitation_sum || []

  let totalMax = 0
  let totalMin = 0
  let rainyDays = 0
  const codeCounts: Record<number, number> = {}

  times.forEach((_, i) => {
    const max = Number(maxTemps[i] ?? 0)
    const min = Number(minTemps[i] ?? 0)
    const precip = precipSums[i]
    const code = Number(codes[i] ?? 0)

    totalMax += max
    totalMin += min

    // A day with >1mm precipitation is considered a rainy day
    if (typeof precip === 'number' && Number.isFinite(precip) && precip > 1) {
      rainyDays++
    }

    codeCounts[code] = (codeCounts[code] ?? 0) + 1
  })

  const n = times.length
  const avgMaxTempC = Math.round(totalMax / n)
  const avgMinTempC = Math.round(totalMin / n)
  const rainyDaysPercent = Math.round((rainyDays / n) * 100)

  // Most frequent weather code → label
  const dominantCode = Number(
    Object.entries(codeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
  )
  const typicalCondition = mapWeatherCodeToLabel(dominantCode)

  return { avgMinTempC, avgMaxTempC, typicalCondition, rainyDaysPercent }
}

/**
 * Merge period conditions from multiple years into a single averaged result.
 */
export function mergeHistoricalConditions(
  conditions: WeatherPeriodConditions[]
): WeatherPeriodConditions {
  const valid = conditions.filter(Boolean)
  if (valid.length === 0) {
    return { avgMinTempC: 0, avgMaxTempC: 20, typicalCondition: 'Variable conditions', rainyDaysPercent: 0 }
  }

  const avgMinTempC = Math.round(valid.reduce((s, c) => s + c.avgMinTempC, 0) / valid.length)
  const avgMaxTempC = Math.round(valid.reduce((s, c) => s + c.avgMaxTempC, 0) / valid.length)
  const rainyDaysPercent = Math.round(valid.reduce((s, c) => s + c.rainyDaysPercent, 0) / valid.length)

  // Pick the most frequently occurring condition label across years
  const conditionFrequency: Record<string, number> = {}
  for (const c of valid) {
    conditionFrequency[c.typicalCondition] = (conditionFrequency[c.typicalCondition] ?? 0) + 1
  }
  const typicalCondition =
    Object.entries(conditionFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Variable conditions'

  return { avgMinTempC, avgMaxTempC, typicalCondition, rainyDaysPercent }
}

/**
 * Build a human-friendly WeatherSummary from aggregated period conditions.
 */
export function buildPeriodWeatherSummary(conditions: WeatherPeriodConditions): WeatherSummary {
  const { avgMaxTempC, avgMinTempC, rainyDaysPercent } = conditions

  const headline =
    avgMaxTempC >= 27 ? 'Typically warm' : avgMaxTempC <= 16 ? 'Typically cool' : 'Typically mild'

  let note: string | null = null

  if (rainyDaysPercent >= 50) {
    note = 'Rain is common during this period.'
  } else if (rainyDaysPercent >= 25) {
    note = 'Some rain is likely during this period.'
  } else if (avgMinTempC <= 10) {
    note = 'Cold nights are typical for this time of year.'
  } else if (avgMaxTempC - avgMinTempC >= 12) {
    note = 'Large temperature swings — pack layers.'
  }

  return { headline, note }
}