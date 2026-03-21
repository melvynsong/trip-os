import { ActivityType } from '@/types/trip'

export const AI_ACTIVITY_TYPES: ActivityType[] = [
  'food',
  'attraction',
  'shopping',
  'transport',
  'hotel',
  'note',
  'other',
]

export type AiGeneratedActivity = {
  title: string
  activity_time: string | null
  type: ActivityType
  notes: string | null
}

export type AiGeneratedDay = {
  day_number: number
  title: string
  activities: AiGeneratedActivity[]
}

export type AiGeneratedItinerary = {
  days: AiGeneratedDay[]
}

export type AiTripContext = {
  title: string
  destination: string
  start_date: string
  end_date: string
}

export type AiTripDayContext = {
  id: string
  day_number: number
  date: string
  title: string | null
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeTime(value: unknown) {
  const time = normalizeText(value)
  return TIME_PATTERN.test(time) ? time : null
}

function normalizeType(value: unknown): ActivityType {
  const type = normalizeText(value).toLowerCase() as ActivityType
  return AI_ACTIVITY_TYPES.includes(type) ? type : 'other'
}

function normalizeActivity(value: unknown): AiGeneratedActivity | null {
  if (!isRecord(value)) {
    return null
  }

  const title = normalizeText(value.title)

  if (!title) {
    return null
  }

  const notes = normalizeText(value.notes)

  return {
    title,
    activity_time: normalizeTime(value.activity_time),
    type: normalizeType(value.type),
    notes: notes || null,
  }
}

function extractJsonObject(content: string) {
  const trimmed = content.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI response did not contain valid JSON')
  }

  return trimmed.slice(firstBrace, lastBrace + 1)
}

export function parseGeneratedItinerary(content: string, dayCount: number) {
  const parsed = JSON.parse(extractJsonObject(content)) as unknown
  return normalizeGeneratedItinerary(parsed, dayCount)
}

export function normalizeGeneratedItinerary(
  value: unknown,
  dayCount: number
): AiGeneratedItinerary {
  const root = isRecord(value) ? value : {}
  const inputDays = Array.isArray(root.days) ? root.days : []
  const dayMap = new Map<number, AiGeneratedDay>()

  for (const item of inputDays) {
    if (!isRecord(item)) {
      continue
    }

    const rawDayNumber = typeof item.day_number === 'number'
      ? item.day_number
      : Number(item.day_number)

    if (!Number.isInteger(rawDayNumber) || rawDayNumber < 1 || rawDayNumber > dayCount) {
      continue
    }

    const activitiesInput = Array.isArray(item.activities) ? item.activities : []
    const activities = activitiesInput
      .map(normalizeActivity)
      .filter((activity): activity is AiGeneratedActivity => activity !== null)
      .slice(0, 12)

    const existing = dayMap.get(rawDayNumber)
    const title = normalizeText(item.title, existing?.title || `Day ${rawDayNumber}`)

    dayMap.set(rawDayNumber, {
      day_number: rawDayNumber,
      title,
      activities: existing ? [...existing.activities, ...activities] : activities,
    })
  }

  const days: AiGeneratedDay[] = []

  for (let dayNumber = 1; dayNumber <= dayCount; dayNumber += 1) {
    const existing = dayMap.get(dayNumber)

    days.push({
      day_number: dayNumber,
      title: existing?.title || `Day ${dayNumber}`,
      activities: existing?.activities || [],
    })
  }

  return { days }
}

export function buildItineraryPrompt(
  trip: AiTripContext,
  days: AiTripDayContext[],
  userPrompt: string
) {
  const dayLines = days
    .map(
      (day) =>
        `Day ${day.day_number} (${day.date})${day.title ? ` - current title: ${day.title}` : ''}`
    )
    .join('\n')

  return [
    'Create a practical travel itinerary draft in JSON only.',
    `Trip title: ${trip.title}`,
    `Destination: ${trip.destination}`,
    `Start date: ${trip.start_date}`,
    `End date: ${trip.end_date}`,
    `Trip has exactly ${days.length} days.`,
    'Use the exact day numbers provided below.',
    dayLines,
    'User preferences:',
    userPrompt,
    'Requirements:',
    '- Return only JSON matching the requested schema.',
    '- Include all days from 1 to the trip day count.',
    '- Each day should have a short title and 2 to 5 activities when reasonable.',
    '- Keep activities realistic for the destination and pace requested.',
    '- activity_time must be either null or HH:MM in 24-hour time.',
    `- type must be one of: ${AI_ACTIVITY_TYPES.join(', ')}.`,
    '- notes should be concise and optional.',
    '- Do not mention flights unless clearly relevant.',
    '- Balance food, attractions, shopping, transport, hotel, note, or other based on the prompt.',
  ].join('\n')
}
