import { WeatherDay } from './types'

/**
 * Fetches daily weather for a trip using the internal API. Returns a map keyed by YYYY-MM-DD.
 * Returns an empty map if fetch fails, but logs a server-side error.
 */
export async function fetchTripWeather(
  destination: string,
  startDate: string,
  endDate: string
): Promise<Record<string, WeatherDay>> {
  if (!destination || !startDate || !endDate) return {}
  try {
    const url = `${process.env.INTERNAL_WEATHER_API_URL || 'http://localhost:3000/api/weather'}?destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}`
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data.days)) return {}
    const map: Record<string, WeatherDay> = {}
    for (const day of data.days) {
      if (day.date) map[day.date] = day
    }
    return map
  } catch (err) {
    console.error('[Itinerary] Failed to fetch weather:', err)
    return {}
  }
}
