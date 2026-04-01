
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
  endDate: string,
  latitude?: number | null,
  longitude?: number | null
): Promise<Record<string, WeatherDay>> {
  // Only fetch weather if destination is a non-empty string
  if (!destination || typeof destination !== 'string' || !destination.trim() || !startDate || !endDate) return {}
  try {
    let lat = latitude, lng = longitude;
    if (lat == null || lng == null) {
      // fallback: geocode
      try {
        const geo = await geocodeDestination(destination)
        lat = geo.latitude
        lng = geo.longitude
      } catch (err) {
        if (err instanceof Error && 'code' in err && (err as any).code === 'destination_not_found') {
          // Suppress error for unrecognized destinations
          return {}
        }
        // Other errors: log and return empty
        console.error('[Itinerary] Weather fetch failed (geocode):', err)
        return {}
      }
    }
    if (lat == null || lng == null) return {}
    // Fetch forecast from Open-Meteo
    const forecast = await fetchOpenMeteoDailyForecast(lat, lng, startDate, endDate)
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
