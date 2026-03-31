import type { ActivityType } from '@/types/trip'

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

export function buildItineraryPrompt(
  trip: AiTripContext,
  days: AiTripDayContext[],
  userPrompt: string
): string {
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