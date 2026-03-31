Use this for `lib/ai/story-normalizer.ts`:

````ts
// lib/ai/story-normalizer.ts

import type { StoryAIResult, StoryTone, StoryActivity } from './story'

const STORY_TONES: StoryTone[] = [
  'warm_personal',
  'fun_casual',
  'reflective',
  'journal',
  'family_memory',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return ''

  let s = value.replace(/\r\n/g, '\n').trim()

  // Remove markdown fences
  s = s.replace(/^```(?:json)?\s*/i, '')
  s = s.replace(/\s*```$/i, '')

  // Remove accidental surrounding quotes
  s = s.replace(/^["'`]+/, '').replace(/["'`]+$/, '')

  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n').trim()

  if (s.length > maxLen) {
    s = s.slice(0, maxLen).trim()
  }

  return s
}

function normalizeTone(value: unknown): StoryTone {
  if (typeof value !== 'string') return 'warm_personal'

  const tone = value.trim().toLowerCase()

  if (STORY_TONES.includes(tone as StoryTone)) {
    return tone as StoryTone
  }

  if (tone.includes('warm') || tone.includes('personal')) return 'warm_personal'
  if (tone.includes('casual') || tone.includes('fun')) return 'fun_casual'
  if (tone.includes('reflect')) return 'reflective'
  if (tone.includes('journal')) return 'journal'
  if (tone.includes('family')) return 'family_memory'

  return 'warm_personal'
}

function buildFallbackTitle(opts: {
  tripDestination?: string
  dayNumber?: number
}): string {
  const destination = opts.tripDestination?.trim()

  if (destination) return `A Day in ${destination}`
  if (opts.dayNumber) return `Day ${opts.dayNumber} Memories`
  return 'Trip Day Story'
}

function buildFallbackContent(activities?: StoryActivity[]): string {
  const titles =
    activities
      ?.map((activity) => activity.title?.trim())
      .filter((title): title is string => Boolean(title)) ?? []

  if (titles.length === 0) {
    return 'No activities were recorded for this day.'
  }

  if (titles.length === 1) {
    return `The day centered around ${titles[0]}.`
  }

  if (titles.length === 2) {
    return `The day unfolded through ${titles[0]} and ${titles[1]}.`
  }

  const allButLast = titles.slice(0, -1).join(', ')
  const last = titles[titles.length - 1]

  return `The day unfolded through ${allButLast}, and ${last}.`
}

export function normalizeStoryAIResult(
  raw: unknown,
  opts: {
    tripDestination?: string
    dayNumber?: number
    activities?: StoryActivity[]
  } = {}
): StoryAIResult {
  let parsed: unknown = raw

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      parsed = {}
    }
  }

  const obj = isRecord(parsed) ? parsed : {}

  const title = cleanString(obj.title, 120)
  const content = cleanString(obj.content, 2000)
  const tone = normalizeTone(obj.tone)

  return {
    title: title || buildFallbackTitle(opts),
    content: content || buildFallbackContent(opts.activities),
    tone,
  }
}
````
