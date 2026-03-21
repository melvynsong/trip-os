import { getEmoji } from '@/lib/utils/getEmoji'

export type ShareLength = 'short' | 'detailed'
export type ShareTone = 'default' | 'family'
export type ShareStyle = 'balanced' | 'logistics'

export type WhatsAppFormatOptions = {
  length?: ShareLength
  tone?: ShareTone
  style?: ShareStyle
}

export type ShareActivity = {
  title: string
  type?: string | null
  activity_time?: string | null
  notes?: string | null
  placeName?: string | null
}

export type ShareDay = {
  dayNumber?: number | null
  date: string
  city?: string | null
  title?: string | null
  hotel?: string | null
  notes?: string | null
  activities: ShareActivity[]
}

export type TripShareInput = {
  tripTitle: string
  startDate: string
  endDate: string
  destinations?: string[]
  hotel?: string | null
  days: ShareDay[]
}

export type DayShareInput = ShareDay & {
  tripTitle?: string | null
}

export type TodayShareInput = {
  tripTitle: string
  date: string
  city?: string | null
  hotel?: string | null
  activities: ShareActivity[]
}

type PeriodKey = 'morning' | 'afternoon' | 'evening' | 'anytime'

const PERIOD_LABEL: Record<Exclude<PeriodKey, 'anytime'>, string> = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening: '🌙 Evening',
}

function clean(value: string | null | undefined): string | null {
  const v = value?.trim()
  return v ? v : null
}

function safeLines(lines: Array<string | null | undefined>): string {
  return lines.filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

function formatDateCompact(date: string) {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d)
}

function formatTime(time: string | null | undefined) {
  const value = clean(time)
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

function withTime(activity: ShareActivity) {
  const emoji = getEmoji(activity.type || 'other')
  const title = clean(activity.title) || 'Untitled activity'
  const time = formatTime(activity.activity_time)
  const placeName = clean(activity.placeName)
  const placeSuffix = placeName ? ` · 📍 ${placeName}` : ''
  if (!time) return `• ${emoji} ${title}${placeSuffix}`
  return `• ${time} ${emoji} ${title}${placeSuffix}`
}

function byTime(a: ShareActivity, b: ShareActivity) {
  const ta = clean(a.activity_time)
  const tb = clean(b.activity_time)
  if (ta && tb) return ta < tb ? -1 : ta > tb ? 1 : 0
  if (ta) return -1
  if (tb) return 1
  return 0
}

function toPeriod(time: string | null | undefined): PeriodKey {
  const value = clean(time)
  if (!value) return 'anytime'
  const [h] = value.split(':').map(Number)
  if (Number.isNaN(h)) return 'anytime'
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function pickTopHighlights(activities: ShareActivity[], maxItems: number) {
  return [...activities].sort(byTime).slice(0, maxItems)
}

function pickMealHighlights(activities: ShareActivity[], maxItems: number) {
  return activities
    .filter((activity) => activity.type === 'food')
    .map((activity) => clean(activity.title))
    .filter((title): title is string => Boolean(title))
    .slice(0, maxItems)
}

function pickNotes(activities: ShareActivity[], maxItems: number) {
  return activities
    .map((activity) => clean(activity.notes))
    .filter((note): note is string => Boolean(note))
    .slice(0, maxItems)
}

function groupByPeriod(activities: ShareActivity[]) {
  const grouped: Record<PeriodKey, ShareActivity[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    anytime: [],
  }

  ;[...activities].sort(byTime).forEach((activity) => {
    grouped[toPeriod(activity.activity_time)].push(activity)
  })

  return grouped
}

function buildToneFooter(tone: ShareTone) {
  if (tone === 'family') {
    return '❤️ Shared from Trip.OS'
  }
  return '📲 Shared via Trip.OS'
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function formatDayForWhatsApp(
  input: DayShareInput,
  options: WhatsAppFormatOptions = {}
) {
  const length = options.length ?? 'short'
  const tone = options.tone ?? 'default'

  const dayLabel =
    input.dayNumber != null ? `Day ${input.dayNumber}` : formatDateCompact(input.date)
  const city = clean(input.city)
  const hotel = clean(input.hotel)

  const grouped = groupByPeriod(input.activities)
  const highlights = pickTopHighlights(input.activities, length === 'short' ? 5 : 8)
  const mealHighlights = pickMealHighlights(input.activities, 3)
  const noteHighlights = pickNotes(input.activities, 2)

  if (length === 'short') {
    return safeLines([
      `🗓️ *${dayLabel} Plan*`,
      `${formatDate(input.date)}`,
      city ? `📍 ${city}` : null,
      hotel ? `🏨 ${hotel}` : null,
      '',
      highlights.length > 0
        ? highlights.map(withTime).join('\n')
        : '• Flexible day / free time',
      mealHighlights.length > 0 ? '' : null,
      mealHighlights.length > 0 ? `🍽️ Meals: ${mealHighlights.join(' · ')}` : null,
      noteHighlights.length > 0 ? `📝 Note: ${noteHighlights[0]}` : null,
      '',
      buildToneFooter(tone),
    ])
  }

  const periodSections = (['morning', 'afternoon', 'evening'] as const)
    .map((period) => {
      const items = grouped[period]
      if (items.length === 0) return `${PERIOD_LABEL[period]}\n• Free / flexible`
      return `${PERIOD_LABEL[period]}\n${items.map(withTime).join('\n')}`
    })
    .join('\n\n')

  return safeLines([
    `🗓️ *${dayLabel} Detailed Plan*`,
    `${formatDate(input.date)}`,
    city ? `📍 ${city}` : null,
    hotel ? `🏨 ${hotel}` : null,
    '',
    periodSections,
    grouped.anytime.length > 0 ? '' : null,
    grouped.anytime.length > 0
      ? `🧩 Anytime\n${grouped.anytime.map(withTime).join('\n')}`
      : null,
    mealHighlights.length > 0 ? '' : null,
    mealHighlights.length > 0 ? `🍽️ Meal highlights: ${mealHighlights.join(' · ')}` : null,
    noteHighlights.length > 0 ? `📝 Key notes: ${noteHighlights.join(' · ')}` : null,
    clean(input.notes) ? `📌 Day note: ${clean(input.notes)}` : null,
    '',
    buildToneFooter(tone),
  ])
}

export function formatTodayForWhatsApp(
  input: TodayShareInput,
  options: WhatsAppFormatOptions = {}
) {
  const length = options.length ?? 'short'
  const tone = options.tone ?? 'default'

  const sorted = [...input.activities].sort(byTime)
  const nowItem = sorted.find((item) => {
    const t = clean(item.activity_time)
    if (!t) return false
    const [h, m] = t.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return false
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const itemMinutes = h * 60 + m
    return itemMinutes <= nowMinutes
  })

  const nowIndex = nowItem ? sorted.findIndex((item) => item === nowItem) : -1
  const nextItem = nowIndex >= 0 ? sorted[nowIndex + 1] ?? null : sorted[0] ?? null
  const highlights = pickTopHighlights(sorted, length === 'short' ? 5 : 8)

  return safeLines([
    `📍 *Today Plan*`,
    `${formatDate(input.date)}`,
    clean(input.city) ? `🏙️ ${clean(input.city)}` : null,
    clean(input.hotel) ? `🏨 ${clean(input.hotel)}` : null,
    '',
    nowItem ? `⏱️ Now: ${withTime(nowItem).replace(/^•\s*/, '')}` : null,
    nextItem ? `➡️ Next: ${withTime(nextItem).replace(/^•\s*/, '')}` : null,
    nowItem || nextItem ? '' : null,
    highlights.length > 0
      ? highlights.map(withTime).join('\n')
      : '• Free day / no fixed activities yet',
    '',
    buildToneFooter(tone),
  ])
}

export function formatTripForWhatsApp(
  input: TripShareInput,
  options: WhatsAppFormatOptions = {}
) {
  const length = options.length ?? 'short'
  const tone = options.tone ?? 'default'

  const destinations = (input.destinations || [])
    .map((destination) => clean(destination))
    .filter((destination): destination is string => Boolean(destination))

  const dayLimit = length === 'short' ? input.days.length : input.days.length

  const dayLines = input.days.slice(0, dayLimit).map((day) => {
    const highlights = pickTopHighlights(day.activities, length === 'short' ? 3 : 6)
    const header = `🗓️ Day ${day.dayNumber ?? '?'} · ${formatDateCompact(day.date)}${
      clean(day.city) ? ` · ${clean(day.city)}` : ''
    }`
    const body =
      highlights.length > 0
        ? highlights.map(withTime).join('\n')
        : '• Flexible day / free time'

    return `${header}\n${body}`
  })

  return safeLines([
    `✈️ *${input.tripTitle}*`,
    `🗓️ ${formatDate(input.startDate)} → ${formatDate(input.endDate)}`,
    destinations.length > 0 ? `📍 ${destinations.join(' · ')}` : null,
    clean(input.hotel) ? `🏨 ${clean(input.hotel)}` : null,
    '',
    dayLines.join('\n\n'),
    '',
    buildToneFooter(tone),
  ])
}
