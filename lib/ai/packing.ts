

export function buildPackingListPrompt({
  destination,
  start_date,
  end_date,
  number_of_days,
  weather,
  packing_style,
}: {
  destination: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  weather: string;
  packing_style: string;
}) {
  // ...existing code for prompt construction...
}
import { branding } from '@/lib/branding'
import type { WeatherMode } from '@/lib/weather/types'
import type { PackingList, PackingListCategory, PackingListItem } from '@/types/packing-list'

// ---------------------------------------------------------------------------
// Packing types
// ---------------------------------------------------------------------------

export type Activity = {
  name: string
}

export type PackingStyle = 'light' | 'moderate' | 'heavy'

// PackingList, PackingListCategory, PackingListItem now imported from types/packing-list.ts

export type PackingWeatherContext = {
  mode: WeatherMode | 'none'
  /** E.g. "Mostly warm", "Typically cool" */
  headline: string
  /** E.g. "Rain expected on some days." */
  note: string | null
  avgMinTempC: number | null
  avgMaxTempC: number | null
  rainyDaysPercent: number | null
}

export type PackingTripContext = {
  destination: string
  startDate: string
  endDate: string
  durationDays: number
  packingStyle: PackingStyle
  weather: PackingWeatherContext
  activities?: Array<{
    id: string
    day_id: string
    title: string
    activity_time: string | null
    type: string
    notes: string | null
    sort_order: number
    place_id: string | null
    created_at: string
  }>
}

// ---------------------------------------------------------------------------
// OpenAI JSON schema (strict mode)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const STYLE_GUIDANCE: Record<PackingStyle, string> = {
  light:
    'Pack as little as possible. Maximise re-use of outfits. Prefer a carry-on bag or day pack. Suggest the minimum that is genuinely practical. Do not pad the list.',
  moderate:
    'Pack a balanced bag — enough variety to feel comfortable without overpacking. One checked bag is acceptable. Include useful extras but avoid redundancy.',
  heavy:
    'Pack a full bag. Prioritise comfort, options, and preparedness. Include backups, extras, and anything that makes the trip easier. Checked luggage assumed.',
}

const STYLE_QUANTITY_GUIDANCE: Record<PackingStyle, string> = {
  light:
    'For a trip this long, assume re-wearing. Use quantities like "2–3" even for a week. Never exceed 1 extra outfit unless the trip is 10+ days.',
  moderate:
    'Scale quantities naturally with trip length. A 3-day trip warrants 3 outfits; a 7-day trip warrants 4–5. One backup per category is fine.',
  heavy:
    'Include extra quantities. A 5-day trip can have 5–6 outfits. Add backups liberally. Comfort over minimalism.',
}

function formatWeatherSection(weather: PackingWeatherContext): string {
  if (weather.mode === 'none') {
    return [
      'Weather data: Not available.',
      'Instruction: Use typical seasonal expectations for the destination and month.',
      'Do NOT make up specific temperatures or rainfall figures.',
      'Use hedged language: "likely to be warm at this time of year" rather than stating facts.',
    ].join('\n')
  }

  const tempRange =
    weather.avgMinTempC !== null && weather.avgMaxTempC !== null
      ? `Temperature range: ${weather.avgMinTempC}°C – ${weather.avgMaxTempC}°C daily`
      : null

  const rain =
    weather.rainyDaysPercent !== null
      ? `Rain likelihood: ${weather.rainyDaysPercent}% of days`
      : null

  const modeGuidance: Record<WeatherMode, string> = {
    forecast:
      'This is a real, precise daily forecast. Reference specific conditions confidently (rain, heat, cold, etc).',
    outlook:
      'This is an early outlook based on historical data for this time of year. Use cautious language: "likely to be", "chance of", "typically". Do not assert certainty.',
    climate:
      'This is typical climate data — historical averages only. Use general language: "this destination is usually", "conditions tend to be". No specific predictions.',
  }

  return [
    `Weather basis: ${weather.mode}`,
    `Summary: ${weather.headline}${weather.note ? ` — ${weather.note}` : ''}`,
    tempRange,
    rain,
    `Instruction: ${modeGuidance[weather.mode]}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function pluralise(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural
}

export function buildPackingPrompt(ctx: PackingTripContext): string {
  const { destination, startDate, endDate, durationDays, packingStyle, weather, activities } = ctx

  const durationLabel = `${durationDays} ${pluralise(durationDays, 'day', 'days')}`

  let activitiesSection = ''
  if (activities && activities.length > 0) {
    const activitySummaries = activities.map(a => {
      const time = a.activity_time ? ` at ${a.activity_time}` : ''
      const type = a.type ? ` (${a.type})` : ''
      return `- ${a.title}${type}${time}${a.notes ? ` — ${a.notes}` : ''}`
    })
    activitiesSection = [
      '',
      '== ITINERARY ACTIVITIES ==',
      'The following activities are planned for this trip:',
      ...activitySummaries,
      '',
      'Use these activities to infer special packing needs (e.g. hiking, swimming, formal dinner, etc).',
    ].join('\n')
  }

  return [
    `You are a smart travel assistant helping a traveller pack efficiently for their trip.`,
    `Your job is to produce a realistic, practical, and personalised packing list.`,
    '',
    '== TRIP DETAILS ==',
    `Destination: ${destination}`,
    `Travel dates: ${startDate} to ${endDate} (${durationLabel})`,
    `Packing style: ${packingStyle}`,
    '',
    '== PACKING STYLE GUIDANCE ==',
    STYLE_GUIDANCE[packingStyle],
    '',
    '== QUANTITY GUIDANCE ==',
    STYLE_QUANTITY_GUIDANCE[packingStyle],
    '',
    '== WEATHER CONTEXT ==',
    formatWeatherSection(weather),
    activitiesSection,
    '',
    '== OUTPUT RULES ==',
    '- Output a single top-level "categories" array. Each category must have a "name" and an "items" array.',
    '- Do NOT use a "sections" object or any other structure.',
    '- Each item must have: name (string), quantity (number), and optional notes (string).',
    '- Do NOT duplicate items across categories.',
    '- Do NOT use markdown, bullets, or symbols in any field.',
    '- Every category must be present in the JSON (use an empty array if not applicable).',
    `- Keep the total list practical. This is ${branding.appName} — calm, useful, not overwhelming.`,
    '',
    '== SAMPLE OUTPUT ==',
    '{',
    '  "categories": [',
    '    { "name": "Clothing", "items": [ { "name": "T-shirt", "quantity": 3, "notes": "Lightweight" } ] },',
    '    { "name": "Essentials", "items": [ { "name": "Toothbrush", "quantity": 1 } ] }',
    '  ]',
    '}',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Output parser / validator
// ---------------------------------------------------------------------------
