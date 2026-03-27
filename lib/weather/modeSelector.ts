import type { WeatherMode } from './types'

/**
 * Maximum days ahead that the Open-Meteo forecast API reliably covers.
 * (Free tier supports up to 16 forecast days.)
 */
export const FORECAST_HORIZON_DAYS = 16

/**
 * Trips beyond this many days use climate (multi-year historical average).
 * Trips between FORECAST_HORIZON_DAYS and this threshold use outlook (last year's data).
 */
export const OUTLOOK_HORIZON_DAYS = 90

type ModeSelection = {
  mode: WeatherMode
  /** Human-readable label shown in the UI header chip, e.g. "Daily forecast". */
  confidenceLabel: string
  /**
   * Non-null explanation injected for non-forecast modes so users understand
   * the data is not a precise daily prediction.
   */
  contextNote: string | null
  /** Number of historical years to average when mode is not forecast. */
  historicalYears: number
}

/**
 * Determine the appropriate weather mode based on how many calendar days
 * remain until the trip starts.
 *
 * @param tripStartDate ISO-8601 date string, e.g. "2026-06-15"
 * @param today         ISO-8601 date string; defaults to today in UTC.
 */
export function selectWeatherMode(tripStartDate: string, today?: string): ModeSelection {
  const todayStr = today ?? new Date().toISOString().slice(0, 10)
  const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime()
  const tripMs = new Date(`${tripStartDate}T00:00:00Z`).getTime()
  const daysUntilStart = Math.floor((tripMs - todayMs) / (1000 * 60 * 60 * 24))

  if (daysUntilStart <= FORECAST_HORIZON_DAYS) {
    return {
      mode: 'forecast',
      confidenceLabel: 'Daily forecast',
      contextNote: null,
      historicalYears: 0,
    }
  }

  if (daysUntilStart <= OUTLOOK_HORIZON_DAYS) {
    return {
      mode: 'outlook',
      confidenceLabel: 'Early outlook',
      contextNote:
        "Your trip is still a few weeks away. We're showing likely conditions based on this time of year — not a day-by-day forecast.",
      historicalYears: 2,
    }
  }

  return {
    mode: 'climate',
    confidenceLabel: 'Typical conditions',
    contextNote:
      "Your trip is more than 3 months away. We're showing typical conditions for this destination and time of year based on historical data.",
    historicalYears: 3,
  }
}

/**
 * Return a start and end date shifted back by `years` years, keeping the
 * same month-day to represent "same time of year".
 */
export function shiftDateRangeByYears(
  startDate: string,
  endDate: string,
  years: number
): { start: string; end: string } {
  function shiftYear(iso: string, delta: number) {
    const [y, m, d] = iso.split('-').map(Number)
    const shifted = new Date(Date.UTC(y - delta, m - 1, d))
    return shifted.toISOString().slice(0, 10)
  }
  return { start: shiftYear(startDate, years), end: shiftYear(endDate, years) }
}
