import { describe, expect, it } from 'vitest'
import {
  buildTripWeatherSummary,
  filterForecastByDateRange,
  mapWeatherCodeToLabel,
  transformOpenMeteoDailyForecast,
} from './transform'
import type { OpenMeteoForecastResponse, WeatherDay } from './types'

describe('mapWeatherCodeToLabel', () => {
  it('maps common weather codes correctly', () => {
    expect(mapWeatherCodeToLabel(0)).toBe('Clear')
    expect(mapWeatherCodeToLabel(2)).toBe('Partly cloudy')
    expect(mapWeatherCodeToLabel(63)).toBe('Rain')
    expect(mapWeatherCodeToLabel(80)).toBe('Showers')
    expect(mapWeatherCodeToLabel(71)).toBe('Snow')
    expect(mapWeatherCodeToLabel(95)).toBe('Thunderstorm')
  })
})

describe('transformOpenMeteoDailyForecast', () => {
  it('transforms provider response into simplified weather days', () => {
    const raw: OpenMeteoForecastResponse = {
      daily: {
        time: ['2026-04-01', '2026-04-02'],
        weather_code: [0, 61],
        temperature_2m_max: [29.4, 23.6],
        temperature_2m_min: [20.2, 15.1],
        precipitation_probability_max: [10, 63],
      },
    }

    const days = transformOpenMeteoDailyForecast(raw)

    expect(days).toEqual([
      {
        date: '2026-04-01',
        minTempC: 20,
        maxTempC: 29,
        rainProbability: 10,
        conditionCode: 0,
        conditionLabel: 'Clear',
      },
      {
        date: '2026-04-02',
        minTempC: 15,
        maxTempC: 24,
        rainProbability: 63,
        conditionCode: 61,
        conditionLabel: 'Rain',
      },
    ])
  })
})

describe('filterForecastByDateRange', () => {
  it('keeps only days in the requested inclusive range', () => {
    const days: WeatherDay[] = [
      {
        date: '2026-04-01',
        minTempC: 18,
        maxTempC: 27,
        rainProbability: 20,
        conditionCode: 1,
        conditionLabel: 'Mainly clear',
      },
      {
        date: '2026-04-02',
        minTempC: 17,
        maxTempC: 24,
        rainProbability: 65,
        conditionCode: 63,
        conditionLabel: 'Rain',
      },
      {
        date: '2026-04-03',
        minTempC: 16,
        maxTempC: 22,
        rainProbability: 35,
        conditionCode: 3,
        conditionLabel: 'Cloudy',
      },
    ]

    expect(filterForecastByDateRange(days, '2026-04-02', '2026-04-03')).toEqual([days[1], days[2]])
  })
})

describe('buildTripWeatherSummary', () => {
  it('returns a warm headline with rain note when rainy days exist', () => {
    const days: WeatherDay[] = [
      {
        date: '2026-04-01',
        minTempC: 21,
        maxTempC: 30,
        rainProbability: 20,
        conditionCode: 1,
        conditionLabel: 'Mainly clear',
      },
      {
        date: '2026-04-02',
        minTempC: 22,
        maxTempC: 31,
        rainProbability: 50,
        conditionCode: 81,
        conditionLabel: 'Showers',
      },
    ]

    expect(buildTripWeatherSummary(days)).toEqual({
      headline: 'Mostly warm',
      note: 'Rain expected on some days.',
    })
  })

  it('returns a cool headline for lower temperatures', () => {
    const days: WeatherDay[] = [
      {
        date: '2026-11-01',
        minTempC: 6,
        maxTempC: 12,
        rainProbability: 5,
        conditionCode: 3,
        conditionLabel: 'Cloudy',
      },
      {
        date: '2026-11-02',
        minTempC: 7,
        maxTempC: 14,
        rainProbability: 10,
        conditionCode: 1,
        conditionLabel: 'Mainly clear',
      },
    ]

    expect(buildTripWeatherSummary(days).headline).toBe('Cooler temperatures ahead')
  })
})