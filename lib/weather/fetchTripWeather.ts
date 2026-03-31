
import { WeatherDay } from './types'
import { geocodeDestination, fetchOpenMeteoDailyForecast } from './openMeteo'
import { transformOpenMeteoDailyForecast, filterForecastByDateRange } from './transform'

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
    // Geocode destination to lat/lon
    const geo = await geocodeDestination(destination)
    if (!geo || !geo.latitude || !geo.longitude) {
      // Graceful fallback: skip weather if geocode fails
      return {}
    }
    // Fetch forecast from Open-Meteo
    const forecast = await fetchOpenMeteoDailyForecast(geo.latitude, geo.longitude, startDate, endDate)
    const days = transformOpenMeteoDailyForecast(forecast)
    const filtered = filterForecastByDateRange(days, startDate, endDate)
    // Map by date
    const map: Record<string, WeatherDay> = {}
    for (const day of filtered) {
      if (day.date) map[day.date] = day
    }
    // Concise log for debugging
    if (Object.keys(map).length === 0) {
      console.info('[Weather] No weather data available for range')
    } else {
      console.info('[Weather] Open-Meteo fetch OK')
    }
    return map
  } catch (err) {
    // Graceful fallback: log and return empty
    console.error('[Itinerary] Weather fetch failed (Open-Meteo direct):', err)
    return {}
  }
}
