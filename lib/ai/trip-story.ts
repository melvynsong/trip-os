import {
  LENGTH_LABEL,
  TONE_LABEL,
  type StoryLength,
  type StoryTone,
} from '@/lib/story/types'
import { branding } from '@/lib/branding'

export type TripStoryDayContext = {
  dayNumber: number
  date: string
  title: string | null
  activities: Array<{
    time: string | null
    title: string
    location: string | null
    notes: string | null
    type: string
  }>
}

export type TripStoryContext = {
  tripTitle: string
  destination: string
  startDate: string
  endDate: string
  notes: string | null
  days: TripStoryDayContext[]
}

export type TripStoryDraft = {
  title: string
  introduction: string
  days: Array<{
    heading: string
    narrative: string
  }>
  closingReflection: string
}

export const TRIP_STORY_JSON_SCHEMA = {
  name: 'trip_story_draft',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      introduction: { type: 'string' },
      days: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            heading: { type: 'string' },
            narrative: { type: 'string' },
          },
          required: ['heading', 'narrative'],
        },
      },
      closingReflection: { type: 'string' },
    },
    required: ['title', 'introduction', 'days', 'closingReflection'],
  },
} as const

const LENGTH_GUIDANCE: Record<StoryLength, string> = {
  short: 'Keep the whole story concise, around 180-260 words total.',
  medium: 'Aim for a balanced editorial story around 320-520 words total.',
  long: 'Write a richer journal-style story around 550-850 words total.',
}

function safeJson(data: unknown) {
  return JSON.stringify(data, null, 2)
}

export function buildTripStoryPrompt(input: {
  context: TripStoryContext
  tone: StoryTone
  length: StoryLength
}) {
  return [
    `You are ${branding.appName}, a warm premium travel editor.`,
    '',
    'Task: turn the structured trip JSON into one cohesive trip story.',
    'Output JSON must follow the provided schema exactly.',
    `Tone: ${TONE_LABEL[input.tone]}`,
    `Length: ${LENGTH_LABEL[input.length]}. ${LENGTH_GUIDANCE[input.length]}`,
    '',
    'Rules:',
    '- Use ONLY facts from the JSON context.',
    '- Do not invent weather, transportation, emotions, meals, people, or events that are not supported.',
    '- Keep the writing natural, reflective, and human, never robotic.',
    '- Write a short introduction, day-by-day narrative sections, and a closing reflection.',
    '- Each day narrative should feel like a chapter and should mention real activities or places when available.',
    '- If a day has limited details, be elegant and honest rather than generic hype.',
    '',
    'Context JSON:',
    safeJson(input.context),
  ].join('\n')
}

export function parseTripStoryDraft(raw: unknown): TripStoryDraft {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response is not a valid trip story object.')
  }

  const data = raw as Record<string, unknown>
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const introduction = typeof data.introduction === 'string' ? data.introduction.trim() : ''
  const closingReflection =
    typeof data.closingReflection === 'string' ? data.closingReflection.trim() : ''

  const days = Array.isArray(data.days)
    ? data.days.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const day = item as Record<string, unknown>
        const heading = typeof day.heading === 'string' ? day.heading.trim() : ''
        const narrative = typeof day.narrative === 'string' ? day.narrative.trim() : ''
        if (!heading || !narrative) return []
        return [{ heading, narrative }]
      })
    : []

  if (!title || !introduction || !closingReflection || days.length === 0) {
    throw new Error('Generated trip story was incomplete.')
  }

  return {
    title,
    introduction,
    days,
    closingReflection,
  }
}
