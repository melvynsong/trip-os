import type { Activity } from '../../types/trip'

export type ItineraryActivity = Pick<
  Activity,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id' | 'created_at'
> & {
  places: { id: string; name: string } | null
}

export type FlightActivityGroup = {
  type: 'flight'
  title: string
  departure?: ItineraryActivity
  arrival?: ItineraryActivity
  summary?: ItineraryActivity
  meta?: {
    airline?: string
    flightNumber?: string
    route?: string
  }
  createdAt?: string
}

export type ItineraryTimelineItem =
  | {
      kind: 'activity'
      activity: ItineraryActivity
      originalIndex: number
      sortMinutes: number | null
    }
  | {
      kind: 'flight'
      group: FlightActivityGroup
      originalIndex: number
      sortMinutes: number | null
    }

export type TimeOfDayKey = 'morning' | 'afternoon' | 'evening' | 'flexible'

export type TimeOfDaySection = {
  key: TimeOfDayKey
  label: string
  items: ItineraryTimelineItem[]
}

const SECTION_LABELS: Record<TimeOfDayKey, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  flexible: 'Flexible',
}

function parseActivityMinutes(value: string | null): number | null {
  if (!value) return null
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function extractRoute(text: string): string | null {
  const match = /\b([A-Z]{3})\s*→\s*([A-Z]{3})\b/.exec(text)
  if (!match) return null
  return `${match[1]} → ${match[2]}`
}

function extractFlightNumber(text: string): string | null {
  const match = /\b([A-Z]{2,3})\s?(\d{1,4}[A-Z]?)\b/.exec(text)
  if (!match) return null
  return `${match[1]} ${match[2]}`
}

function extractAirline(text: string): string | null {
  const flightNumber = extractFlightNumber(text)
  if (!flightNumber) return null
  const escaped = flightNumber.replace(/\s+/, '\\s*')
  const regex = new RegExp(`^(.*?)\\s+${escaped}`)
  const match = regex.exec(text)
  if (!match) return null
  const airline = match[1].trim()
  return airline || null
}

function isLikelyFlight(activity: ItineraryActivity): boolean {
  if (activity.type !== 'transport') return false

  const title = activity.title || ''
  const notes = activity.notes || ''
  const combined = `${title} ${notes}`
  const lower = combined.toLowerCase()

  if (/\bflight\b/.test(lower)) return true
  if (extractFlightNumber(combined.toUpperCase())) return true
  if (extractRoute(combined.toUpperCase()) && /\b(airline|terminal|duration|depart|arrive)\b/.test(lower)) {
    return true
  }

  return false
}

function detectFlightRole(activity: ItineraryActivity): 'departure' | 'arrival' | 'summary' {
  const lower = `${activity.title} ${activity.notes || ''}`.toLowerCase()

  if (/\b(departs|departure)\b/.test(lower)) return 'departure'
  if (/\b(arrives|arrival)\b/.test(lower)) return 'arrival'

  return 'summary'
}

function resolveFlightKey(activity: ItineraryActivity): string | null {
  const combined = `${activity.title} ${activity.notes || ''}`.toUpperCase()
  const flightNumber = extractFlightNumber(combined)
  const route = extractRoute(combined)

  if (!flightNumber && !route) return null
  return `${activity.day_id}|${flightNumber || 'none'}|${route || 'none'}`
}

function getItemPrimaryTime(item: ItineraryTimelineItem): number | null {
  if (item.kind === 'activity') {
    return parseActivityMinutes(item.activity.activity_time)
  }

  return (
    parseActivityMinutes(item.group.departure?.activity_time || null) ??
    parseActivityMinutes(item.group.arrival?.activity_time || null) ??
    parseActivityMinutes(item.group.summary?.activity_time || null)
  )
}

function getSectionKey(minutes: number | null): TimeOfDayKey {
  if (minutes === null) return 'flexible'
  if (minutes >= 300 && minutes <= 719) return 'morning'
  if (minutes >= 720 && minutes <= 1079) return 'afternoon'
  return 'evening'
}

export function transformItineraryDayActivities(activities: ItineraryActivity[]): {
  orderedItems: ItineraryTimelineItem[]
  sections: TimeOfDaySection[]
} {
  const flightGroups = new Map<
    string,
    {
      departure?: ItineraryActivity
      arrival?: ItineraryActivity
      summary?: ItineraryActivity
      originalIndex: number
      createdAt?: string
      meta: FlightActivityGroup['meta']
      extras: ItineraryActivity[]
    }
  >()

  const standaloneItems: ItineraryTimelineItem[] = []

  activities.forEach((activity, index) => {
    if (!isLikelyFlight(activity)) {
      standaloneItems.push({
        kind: 'activity',
        activity,
        originalIndex: index,
        sortMinutes: parseActivityMinutes(activity.activity_time),
      })
      return
    }

    const key = resolveFlightKey(activity) || `single|${activity.id}`
    const role = detectFlightRole(activity)

    const existing = flightGroups.get(key) || {
      originalIndex: index,
      createdAt: activity.created_at,
      meta: {
        airline: extractAirline((activity.notes || '').toUpperCase()) || undefined,
        flightNumber: extractFlightNumber(`${activity.title} ${activity.notes || ''}`.toUpperCase()) || undefined,
        route: extractRoute(`${activity.title} ${activity.notes || ''}`.toUpperCase()) || undefined,
      },
      extras: [],
    }

    if (index < existing.originalIndex) {
      existing.originalIndex = index
    }

    if (activity.created_at && (!existing.createdAt || activity.created_at < existing.createdAt)) {
      existing.createdAt = activity.created_at
    }

    if (!existing.meta?.airline) {
      existing.meta = {
        ...existing.meta,
        airline: extractAirline((activity.notes || '').toUpperCase()) || existing.meta?.airline,
      }
    }

    if (!existing.meta?.flightNumber) {
      existing.meta = {
        ...existing.meta,
        flightNumber:
          extractFlightNumber(`${activity.title} ${activity.notes || ''}`.toUpperCase()) ||
          existing.meta?.flightNumber,
      }
    }

    if (!existing.meta?.route) {
      existing.meta = {
        ...existing.meta,
        route: extractRoute(`${activity.title} ${activity.notes || ''}`.toUpperCase()) || existing.meta?.route,
      }
    }

    if (role === 'departure' && !existing.departure) {
      existing.departure = activity
    } else if (role === 'arrival' && !existing.arrival) {
      existing.arrival = activity
    } else if (role === 'summary' && !existing.summary) {
      existing.summary = activity
    } else {
      existing.extras.push(activity)
    }

    flightGroups.set(key, existing)
  })

  const groupedFlightItems: ItineraryTimelineItem[] = Array.from(flightGroups.values()).map((group) => {
    const title =
      group.summary?.title ||
      (group.meta?.route ? `Flight ${group.meta.route}` : group.meta?.flightNumber ? `Flight ${group.meta.flightNumber}` : 'Flight')

    const flightGroup: FlightActivityGroup = {
      type: 'flight',
      title,
      departure: group.departure,
      arrival: group.arrival,
      summary: group.summary,
      meta: group.meta,
      createdAt: group.createdAt,
    }

    return {
      kind: 'flight',
      group: flightGroup,
      originalIndex: group.originalIndex,
      sortMinutes:
        parseActivityMinutes(group.departure?.activity_time || null) ??
        parseActivityMinutes(group.arrival?.activity_time || null) ??
        parseActivityMinutes(group.summary?.activity_time || null),
    }
  })

  const orderedItems = [...standaloneItems, ...groupedFlightItems].sort((a, b) => {
    const aTime = getItemPrimaryTime(a)
    const bTime = getItemPrimaryTime(b)

    if (aTime !== null && bTime !== null) {
      if (aTime !== bTime) return aTime - bTime
      return a.originalIndex - b.originalIndex
    }

    if (aTime !== null) return -1
    if (bTime !== null) return 1

    return a.originalIndex - b.originalIndex
  })

  const sectionsByKey = new Map<TimeOfDayKey, ItineraryTimelineItem[]>([
    ['morning', []],
    ['afternoon', []],
    ['evening', []],
    ['flexible', []],
  ])

  for (const item of orderedItems) {
    const key = getSectionKey(getItemPrimaryTime(item))
    sectionsByKey.get(key)?.push(item)
  }

  const sections: TimeOfDaySection[] = (['morning', 'afternoon', 'evening', 'flexible'] as TimeOfDayKey[])
    .map((key) => ({ key, label: SECTION_LABELS[key], items: sectionsByKey.get(key) || [] }))
    .filter((section) => section.items.length > 0)

  return { orderedItems, sections }
}
