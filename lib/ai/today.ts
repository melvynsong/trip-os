import { ActivityType, ActivityStatus } from '@/types/trip'

// ---------------------------------------------------------------------------
// Quick action types
// ---------------------------------------------------------------------------

export type QuickActionType =
  | 'replan'
  | 'lighter'
  | 'lunch_nearby'
  | 'shorten'
  | 'replace_attraction'

export const QUICK_ACTION_LABELS: Record<QuickActionType, string> = {
  replan: '🔄 Replan Today',
  lighter: '🌿 Make it Lighter',
  lunch_nearby: '🍜 Find Lunch',
  shorten: '✂️ Shorten Day',
  replace_attraction: '🔀 Replace Attraction',
}

const QUICK_ACTION_INSTRUCTIONS: Record<QuickActionType, string> = {
  replan: 'Create an optimised version of today\'s itinerary, keeping the best items and removing overlap.',
  lighter:
    'Reduce the number of activities in today\'s schedule by removing lower-priority items so the day feels relaxed.',
  lunch_nearby:
    'Add a suitable lunch stop that fits the current timeline. Use saved places if relevant, otherwise suggest something fitting the destination.',
  shorten: 'Trim today to just the 3–4 most important activities.',
  replace_attraction:
    'Replace one or more lower-priority attractions with better alternatives. Use the saved places list if helpful.',
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type TodayActivityContext = {
  id: string
  title: string
  activity_time: string | null
  type: ActivityType
  notes: string | null
  status: ActivityStatus
  sort_order: number
}

export type TodaySavedPlace = {
  id: string
  name: string
  category: string
  address: string | null
}

export type AiReplanRequest = {
  action: QuickActionType
  customPrompt?: string
  trip: {
    title: string
    destination: string
    notes: string | null
  }
  day: {
    date: string
    title: string | null
  }
  currentItems: TodayActivityContext[]
  savedPlaces: TodaySavedPlace[]
}

export type AiReplanActivity = {
  /** null = new suggested item not in original list */
  id: string | null
  title: string
  activity_time: string | null
  type: ActivityType
  notes: string | null
}

export type AiReplanResult = {
  summary: string
  rationale: string
  updatedDay: {
    title: string
    activities: AiReplanActivity[]
  }
}

// ---------------------------------------------------------------------------
// JSON Schema for OpenAI structured output
// ---------------------------------------------------------------------------

export const REPLAN_JSON_SCHEMA = {
  name: 'day_replan',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      rationale: { type: 'string' },
      updatedDay: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                title: { type: 'string' },
                activity_time: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                type: { type: 'string' },
                notes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              },
              required: ['id', 'title', 'activity_time', 'type', 'notes'],
            },
          },
        },
        required: ['title', 'activities'],
      },
    },
    required: ['summary', 'rationale', 'updatedDay'],
  },
} as const

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildReplanPrompt(req: AiReplanRequest): string {
  const instruction = QUICK_ACTION_INSTRUCTIONS[req.action]

  const contextPayload = {
    trip: req.trip,
    day: req.day,
    today_items: req.currentItems.map((i) => ({
      id: i.id,
      title: i.title,
      time: i.activity_time,
      type: i.type,
      notes: i.notes,
      already_completed: i.status === 'done',
    })),
    saved_places: req.savedPlaces,
  }

  return [
    `You are an AI travel companion helping a traveller adjust their itinerary for today.`,
    ``,
    `Trip context (JSON):`,
    JSON.stringify(contextPayload, null, 2),
    ``,
    `Requested action: ${instruction}`,
    req.customPrompt ? `Additional instruction from traveller: ${req.customPrompt}` : '',
    ``,
    `Rules:`,
    `- ALWAYS include already-completed items (already_completed: true) in updatedDay.activities with their original id.`,
    `- For items you keep from the original plan, use their original id.`,
    `- For brand-new items you suggest, set id to null.`,
    `- activity_time must be in HH:MM (24-hour) format or null.`,
    `- type must be one of: food, attraction, shopping, transport, hotel, note, other.`,
    `- Maximum 12 activities in the updated day.`,
    `- List activities in chronological order; activities with no time go last.`,
    `- summary: one sentence describing what changed.`,
    `- rationale: 2–3 sentences explaining why.`,
  ]
    .filter((l) => l !== '' || true)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Response parser / normaliser
// ---------------------------------------------------------------------------

const VALID_TYPES: ActivityType[] = [
  'food',
  'attraction',
  'shopping',
  'transport',
  'hotel',
  'note',
  'other',
]

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback
}

function normaliseTime(v: unknown): string | null {
  const t = str(v)
  return TIME_RE.test(t) ? t : null
}

function normaliseType(v: unknown): ActivityType {
  const t = str(v).toLowerCase() as ActivityType
  return VALID_TYPES.includes(t) ? t : 'other'
}

export function parseReplanResult(raw: unknown): AiReplanResult {
  if (!isRecord(raw)) {
    throw new Error('AI response is not a JSON object.')
  }

  const summary = str(raw.summary, 'Replan completed.')
  const rationale = str(raw.rationale, '')

  if (!isRecord(raw.updatedDay)) {
    throw new Error('AI response is missing updatedDay.')
  }

  const dayTitle = str(raw.updatedDay.title, '')
  const rawActivities = Array.isArray(raw.updatedDay.activities)
    ? raw.updatedDay.activities
    : []

  const activities: AiReplanActivity[] = rawActivities
    .slice(0, 12)
    .map((item): AiReplanActivity | null => {
      if (!isRecord(item)) return null
      const title = str(item.title)
      if (!title) return null
      const rawId = item.id
      const id = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : null
      return {
        id,
        title,
        activity_time: normaliseTime(item.activity_time),
        type: normaliseType(item.type),
        notes: str(item.notes) || null,
      }
    })
    .filter((a): a is AiReplanActivity => a !== null)

  return {
    summary,
    rationale,
    updatedDay: { title: dayTitle, activities },
  }
}
