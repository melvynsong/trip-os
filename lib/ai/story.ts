import {
  DAY_FOCUS_LABEL,
  LENGTH_LABEL,
  PLACE_TYPE_LABEL,
  TONE_LABEL,
  type DayStoryFocus,
  type PlaceStoryTypeOption,
  type SavedStoryType,
  type StoryLength,
  type StoryTone,
} from '@/lib/story/types'

export type StoryDraft = {
  title: string | null
  content: string
  storyType: SavedStoryType
}

export type DayStoryContext = {
  tripTitle: string
  destination: string
  tripNotes: string | null
  date: string
  dayTitle: string | null
  city: string | null
  hotel: string | null
  activities: Array<{
    title: string
    time: string | null
    type: string
    notes: string | null
    placeName: string | null
  }>
  visitedPlaces: Array<{
    name: string
    type: string
    notes: string | null
  }>
}

export type PlaceStoryContext = {
  tripTitle: string
  destination: string
  relatedDate: string | null
  entityName: string
  entityKind: 'place' | 'restaurant' | 'activity'
  category: string | null
  address: string | null
  notes: string | null
  visited: boolean | null
  surroundingContext: Array<{
    title: string
    time: string | null
    type: string
  }>
}

export const STORY_JSON_SCHEMA = {
  name: 'story_draft',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      content: { type: 'string' },
      storyType: { type: 'string' },
    },
    required: ['title', 'content', 'storyType'],
  },
} as const

const LENGTH_GUIDANCE: Record<StoryLength, string> = {
  short: '60-110 words, compact and punchy.',
  medium: '130-220 words, clear and warm.',
  long: '240-380 words, richer detail while still grounded.',
}

function safeJson(data: unknown) {
  return JSON.stringify(data, null, 2)
}

function dayStoryTypeFromFocus(focus: DayStoryFocus): SavedStoryType {
  if (focus === 'food_highlights') return 'food_note'
  return 'day_summary'
}

function placeStoryTypeFromOption(option: PlaceStoryTypeOption, entityKind: PlaceStoryContext['entityKind']): SavedStoryType {
  if (option === 'caption') return 'caption'
  if (option === 'food_note') return 'food_note'
  if (entityKind === 'restaurant') return 'restaurant_story'
  if (entityKind === 'activity') return 'activity_story'
  return 'place_story'
}

export function buildDayStoryPrompt(input: {
  context: DayStoryContext
  tone: StoryTone
  length: StoryLength
  focus: DayStoryFocus
}) {
  const targetStoryType = dayStoryTypeFromFocus(input.focus)

  const prompt = [
    'You are Trip.OS story writer. Turn structured travel data into a human story draft.',
    '',
    'Task: Write ONE day-level story draft from the JSON context below.',
    `Tone: ${TONE_LABEL[input.tone]}`,
    `Length: ${LENGTH_LABEL[input.length]} (${LENGTH_GUIDANCE[input.length]})`,
    `Focus: ${DAY_FOCUS_LABEL[input.focus]}`,
    '',
    'Rules:',
    '- Use ONLY facts from the context JSON. Do not invent places, times, dishes, weather, transport, people, or events.',
    '- Mention real activities/places when present.',
    '- If details are missing, keep wording general and honest.',
    '- Keep it natural, warm, and readable.',
    '- Return JSON matching the schema.',
    `- storyType must be exactly: ${targetStoryType}`,
    '- Title can be null for short form if no strong title emerges.',
    '',
    'Context JSON:',
    safeJson(input.context),
  ].join('\n')

  return { prompt, storyType: targetStoryType }
}

export function buildPlaceStoryPrompt(input: {
  context: PlaceStoryContext
  tone: StoryTone
  length: StoryLength
  storyOption: PlaceStoryTypeOption
}) {
  const targetStoryType = placeStoryTypeFromOption(input.storyOption, input.context.entityKind)

  const prompt = [
    'You are Trip.OS story writer. Turn structured travel data into a grounded memory note.',
    '',
    'Task: Write ONE place/activity-level story draft from the JSON context below.',
    `Tone: ${TONE_LABEL[input.tone]}`,
    `Length: ${LENGTH_LABEL[input.length]} (${LENGTH_GUIDANCE[input.length]})`,
    `Requested type: ${PLACE_TYPE_LABEL[input.storyOption]}`,
    '',
    'Rules:',
    '- Use ONLY facts from the context JSON. Do not invent unsupported details.',
    '- Keep it vivid but truthful.',
    '- Mention concrete names and available notes when provided.',
    '- Return JSON matching the schema.',
    `- storyType must be exactly: ${targetStoryType}`,
    '',
    'Context JSON:',
    safeJson(input.context),
  ].join('\n')

  return { prompt, storyType: targetStoryType }
}

export function parseStoryDraft(raw: unknown): StoryDraft {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response is not a valid JSON object.')
  }

  const data = raw as Record<string, unknown>
  const rawStoryType = typeof data.storyType === 'string' ? data.storyType : 'day_summary'
  const allowed: SavedStoryType[] = [
    'day_summary',
    'place_story',
    'restaurant_story',
    'activity_story',
    'caption',
    'food_note',
  ]

  const storyType = allowed.includes(rawStoryType as SavedStoryType)
    ? (rawStoryType as SavedStoryType)
    : 'day_summary'

  const title = typeof data.title === 'string' ? data.title.trim() : null
  const content = typeof data.content === 'string' ? data.content.trim() : ''

  if (!content) {
    throw new Error('Generated story content was empty.')
  }

  return {
    title: title || null,
    content,
    storyType,
  }
}
