import type { StoryAIResult, StoryTone, StoryActivity } from './story'

const STORY_TONES: StoryTone[] = [
  'warm_personal',
  'fun_casual',
  'reflective',
  'journal',
  'family_memory',
]

function cleanString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return ''
  let s = value.trim()
  // Remove accidental surrounding quotes or markdown fences
  s = s.replace(/^["'`]+|["'`]+$/g, '')
  s = s.replace(/^```(?:json)?|```$/gim, '')
  // Collapse repeated blank lines
  s = s.replace(/\r?\n{3,}/g, '\n\n')
  if (s.length > maxLen) s = s.slice(0, maxLen)
  return s
}

function normalizeTone(tone: unknown): StoryTone {
  if (typeof tone !== 'string') return 'warm_personal'
  const t = tone.toLowerCase()
  if (t.includes('warm')) return 'warm_personal'
  if (t.includes('casual')) return 'fun_casual'
  if (t.includes('reflection')) return 'reflective'
  if (t.includes('journal')) return 'journal'
  if (t.includes('family')) return 'family_memory'
  if (STORY_TONES.includes(t as StoryTone)) return t as StoryTone
  return 'warm_personal'
}

export function normalizeStoryAIResult(
  raw: unknown,
  opts: {
    tripDestination?: string
    dayNumber?: number
    activities?: StoryActivity[]
  } = {}
): StoryAIResult {
  let obj: any = raw

  // Handle stringified JSON
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj)
    } catch {
      obj = {}
    }
  }

  // Remove extra keys, coerce to object
  const result: Partial<StoryAIResult> = {
    title: cleanString(obj?.title, 120),
    content: cleanString(obj?.content, 2000),
    tone: normalizeTone(obj?.tone),
  }

  // Fallbacks
  if (!result.title) {
    if (opts.tripDestination && opts.dayNumber) {
      result.title = `A Day in ${opts.tripDestination}`
    } else if (opts.dayNumber) {
      result.title = `Day ${opts.dayNumber} Memories`
    } else {
      result.title = 'Trip Day Story'
    }
  }

  if (!result.content) {
    if (opts.activities && opts.activities.length > 0) {
      result.content =
        'This day included: ' +
        opts.activities.map((a) => a.title).filter(Boolean).join(', ') +
        '.'
    } else {
      result.content = 'No activities were recorded for this day.'
    }
  }

  return {
    title: result.title,
    content: result.content,
    tone: result.tone ?? 'warm_personal',
  }
}