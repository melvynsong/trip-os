import { getWeatherForTrip } from './existing-weather-api'

export type WeatherDay = {
  date: string
  condition: string
  temperature_min: number | null
  temperature_max: number | null
  reliability: "high" | "medium" | "low"
}

export function classifyWeatherReliability(date: string, today: string): "high" | "medium" | "low" {
  const d1 = new Date(today)
  const d2 = new Date(date)
  const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 3) return "high"
  if (diff <= 7) return "medium"
  return "low"
}

export async function getNormalizedWeather(trip: { destination: string, start_date: string, end_date: string }) : Promise<WeatherDay[]> {
  const raw = await getWeatherForTrip(trip)
  const today = new Date().toISOString().slice(0,10)
  return raw.map((d: any) => ({
    date: d.date,
    condition: d.condition,
    temperature_min: d.temperature_min ?? null,
    temperature_max: d.temperature_max ?? null,
    reliability: classifyWeatherReliability(d.date, today),
  }))
}
