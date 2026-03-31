

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
  throw new Error('getNormalizedWeather is not implemented: missing weather API backend.')
}
