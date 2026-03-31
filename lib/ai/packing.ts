

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
  packing_style?: "light" | "standard" | "heavy";
}) {
  return `
You are a travel assistant. Generate a JSON packing list for a trip.

Input:
- Destination: ${destination}
- Start date: ${start_date}
- End date: ${end_date}
- Number of days: ${number_of_days}
- Weather: ${weather}
- Packing style: ${packing_style ?? "standard"}

Output format (strict JSON, no extra text):

{
  "categories": [
    {
      "category": "Clothing",
      "items": [
        { "name": "T-shirt", "quantity": 3, "notes": "For warm days" }
      ]
    }
    // ... more categories
  ]
}

Rules:
- Quantities must be realistic for the number of days.
- Consider weather and packing style.
- Only include relevant items.
- No extra text, only valid JSON.
`;
}
import { branding } from '@/lib/branding'
import type { WeatherMode } from '@/lib/weather/types'

// ---------------------------------------------------------------------------
// Packing types
// ---------------------------------------------------------------------------

export type Activity = {
  name: string
}

export type PackingStyle = 'light' | 'moderate' | 'heavy'

export type PackingItem = {
  item: string
  quantity: string
  note: string
}

export type PackingSections = {
  clothing: PackingItem[]
  outerwear: PackingItem[]
  footwear: PackingItem[]
  weather_specific: PackingItem[]
  essentials: PackingItem[]
  optional: PackingItem[]
}

export type PackingList = {
  summary: string
  packing_style: PackingStyle
  weather_basis: WeatherMode | 'none'
  sections: PackingSections
}

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
}

// ---------------------------------------------------------------------------
// OpenAI JSON schema (strict mode)
// ---------------------------------------------------------------------------

const PACKING_ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    item: { type: 'string' },
    quantity: { type: 'string' },
    note: { type: 'string' },
  },
  required: ['item', 'quantity', 'note'],
} as const

export const PACKING_JSON_SCHEMA = {
  name: 'packing_list',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      packing_style: { type: 'string' },
      weather_basis: { type: 'string' },
      sections: {
        type: 'object',
        additionalProperties: false,
        properties: {
          clothing: { type: 'array', items: PACKING_ITEM_SCHEMA },
          outerwear: { type: 'array', items: PACKING_ITEM_SCHEMA },
          footwear: { type: 'array', items: PACKING_ITEM_SCHEMA },
          weather_specific: { type: 'array', items: PACKING_ITEM_SCHEMA },
          essentials: { type: 'array', items: PACKING_ITEM_SCHEMA },
          optional: { type: 'array', items: PACKING_ITEM_SCHEMA },
        },
        required: [
          'clothing',
          'outerwear',
          'footwear',
          'weather_specific',
          'essentials',
          'optional',
        ],
      },
    },
    required: ['summary', 'packing_style', 'weather_basis', 'sections'],
  },
} as const

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
  const { destination, startDate, endDate, durationDays, packingStyle, weather } = ctx

  const durationLabel = `${durationDays} ${pluralise(durationDays, 'day', 'days')}`

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
    '',
    '== OUTPUT RULES ==',
    '- summary: 1–2 sentences of high-level actionable guidance. Example: "Warm and slightly rainy — pack light clothing with a rain layer." Be concise.',
    '- packing_style: echo back the packing_style value exactly as given.',
    '- weather_basis: echo back the weather mode exactly as given.',
    '- sections.clothing: tops, bottoms, base layers, sleepwear as appropriate.',
    '- sections.outerwear: jacket, rain jacket, hoodie as appropriate. Leave empty array if truly unnecessary.',
    '- sections.footwear: walking shoes, sandals, dress shoes as appropriate. Usually 1–2 pairs max.',
    '- sections.weather_specific: rain gear, sun protection, thermal layers, etc. Only include items genuinely warranted by weather. Leave empty if no specific weather gear needed.',
    '- sections.essentials: toiletries, chargers, travel documents, medicine. Always include. Keep list tight.',
    '- sections.optional: nice-to-have items the traveller might appreciate but are not essential.',
    '- item: name of the item, concise (2–4 words).',
    '- quantity: approximate amount, e.g. "3–4", "1", "1 pair", "1–2".',
    '- note: 3–10 words of context. Can be empty string if no note is needed.',
    '- Do NOT duplicate items across sections.',
    '- Do NOT use markdown, bullets, or symbols in any field.',
    '- Every section must be present in the JSON (use an empty array if not applicable).',
    `- Keep the total list practical. This is ${branding.appName} — calm, useful, not overwhelming.`,
  ]
    .join('\n')
}

// ---------------------------------------------------------------------------
// Output parser / validator
// ---------------------------------------------------------------------------

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normaliseStr(v: unknown, fallback = ''): string {
  return isString(v) ? v.trim() : fallback
}

function normalisePackingStyle(v: unknown): PackingStyle {
  const s = normaliseStr(v).toLowerCase()
  if (s === 'light' || s === 'moderate' || s === 'heavy') return s
  return 'moderate'
}

function normaliseWeatherBasis(v: unknown): PackingList['weather_basis'] {
  const s = normaliseStr(v).toLowerCase()
  if (s === 'forecast' || s === 'outlook' || s === 'climate' || s === 'none') return s
  return 'none'
}

function normaliseItem(v: unknown): PackingItem | null {
  if (!isRecord(v)) return null
  const item = normaliseStr(v.item)
  if (!item) return null
  return {
    item,
    quantity: normaliseStr(v.quantity, '1'),
    note: normaliseStr(v.note, ''),
  }
}

function normaliseSection(v: unknown): PackingItem[] {
  if (!Array.isArray(v)) return []
  return v.map(normaliseItem).filter((x): x is PackingItem => x !== null)
}

function normaliseSections(v: unknown): PackingSections {
  const r = isRecord(v) ? v : {}
  return {
    clothing: normaliseSection(r.clothing),
    outerwear: normaliseSection(r.outerwear),
    footwear: normaliseSection(r.footwear),
    weather_specific: normaliseSection(r.weather_specific),
    essentials: normaliseSection(r.essentials),
    optional: normaliseSection(r.optional),
  }
}

export function parsePackingList(raw: string): PackingList | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    // Try to extract JSON object from a wrapped string
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
      parsed = JSON.parse(raw.slice(start, end + 1))
    } catch {
      return null
    }
  }

  if (!isRecord(parsed)) return null

  const summary = normaliseStr(parsed.summary)
  if (!summary) return null

  return {
    summary,
    packing_style: normalisePackingStyle(parsed.packing_style),
    weather_basis: normaliseWeatherBasis(parsed.weather_basis),
    sections: normaliseSections(parsed.sections),
  }
}
