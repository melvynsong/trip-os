// lib/ai/story.ts

export type StoryTone =
  | 'warm_personal'
  | 'fun_casual'
  | 'reflective'
  | 'journal'
  | 'family_memory'

export type StoryAIResult = {
  title: string
  content: string
  tone: StoryTone
}

export type StoryTripContext = {
  title: string | null
  destination: string | null
}

export type StoryDayContext = {
  day_number: number
  date: string | null
  title: string | null
}

export type StoryActivity = {
  title: string
  time: string | null
  type: string | null
  notes: string | null
}

export function buildStoryPrompt(
  trip: StoryTripContext,
  day: StoryDayContext,
  activities: StoryActivity[],
  tone: StoryTone = 'warm_personal'
): string {
  const tripTitle = trip.title?.trim() || 'Untitled Trip'
  const destination = trip.destination?.trim() || 'Unknown Destination'
  const dayDate = day.date?.trim() || 'Unknown Date'
  const dayTitle = day.title?.trim()

  const activityLines =
    activities.length > 0
      ? activities
          .map((activity) => {
            const time = activity.time?.trim()
            const title = activity.title?.trim() || 'Untitled Activity'
            const type = activity.type?.trim() || 'activity'
            const notes = activity.notes?.trim()

            return `- ${time ? `[${time}] ` : ''}${title} (${type})${notes ? ` — ${notes}` : ''}`
          })
          .join('\n')
      : '- No activities provided.'

  return [
    'You are writing a grounded travel day story based strictly on structured activity data.',
    'Write in a natural, human, warm style.',
    'Keep it cohesive and readable, but not dramatic, poetic, or repetitive.',
    'Use only the information explicitly provided.',
    'Do not invent weather, scenery, meals, emotions, conversations, or experiences unless they are explicitly included in the input.',
    'Light transitions are allowed only to improve flow.',
    '',
    `Trip: ${tripTitle} (${destination})`,
    `Day: ${day.day_number} (${dayDate})${dayTitle ? ` - ${dayTitle}` : ''}`,
    '',
    'Activities:',
    activityLines,
    '',
    `Requested tone: ${tone}`,
    '',
    'STRICT OUTPUT RULES:',
    '- Return exactly one valid JSON object.',
    '- Do not include markdown, code fences, commentary, or extra text.',
    '- Do not include extra keys.',
    '- "title" must be a string.',
    '- "content" must be a string.',
    '- "tone" must be exactly one of: "warm_personal", "fun_casual", "reflective", "journal", "family_memory".',
    '',
    'Return exactly this shape:',
    '{ "title": string, "content": string, "tone": "warm_personal" | "fun_casual" | "reflective" | "journal" | "family_memory" }',
  ].join('\n')
}