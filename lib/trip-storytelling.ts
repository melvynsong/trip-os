export type StoryPeriod = 'morning' | 'afternoon' | 'evening' | 'anytime'

export function formatDisplayDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatDisplayDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} — ${endDate}`
  }

  const sameYear = start.getFullYear() === end.getFullYear()
  const startFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  const endFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${startFormat.format(start)} — ${endFormat.format(end)}`
}

export function formatTimeLabel(value: string | null | undefined) {
  if (!value) return null

  const [hourRaw, minuteRaw] = value.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value

  const date = new Date()
  date.setHours(hour, minute, 0, 0)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getStoryPeriod(time: string | null | undefined): StoryPeriod {
  if (!time) return 'anytime'

  const [hourRaw] = time.split(':')
  const hour = Number(hourRaw)
  if (Number.isNaN(hour)) return 'anytime'

  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function buildTripStoryText(input: {
  title: string
  introduction: string
  days: Array<{ heading: string; narrative: string }>
  closingReflection: string
}) {
  return [
    input.title,
    '',
    input.introduction,
    '',
    ...input.days.flatMap((day) => [day.heading, day.narrative, '']),
    input.closingReflection,
  ]
    .join('\n')
    .trim()
}
