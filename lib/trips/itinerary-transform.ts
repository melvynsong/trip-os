import type { Activity } from '../../types/trip'
import { parseFlightDuration, deriveFlightArrivalDateTime } from '../flights/activity'

export type ItineraryActivity = Pick<
  Activity,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id' | 'created_at'
> & {
  places: { id: string; name: string } | null
  arrival_datetime?: string | null
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
      /** A single unified flight activity, shown as a journey card. */
      kind: 'flight_card'
      activity: any // FlightActivity
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
  // Try to match 'AirlineName XX 123' or 'AirlineName XX123'
  const match = text.match(/([A-Z][A-Z\s]+?)\s+[A-Z]{2,3}\s?\d{1,4}[A-Z]?/);
  if (match) {
    return match[1].trim();
  }
  // Fallback: try to match 'AirlineName' before '·' or 'FLIGHT'
  const fallback = text.match(/([A-Z][A-Z\s]+?)\s+·/);
  if (fallback) {
    return fallback[1].trim();
  }
  return null;
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
  const lower = `${activity.title} ${activity.notes || ''}`.toLowerCase();

  // Match common departure/arrival keywords
  if (/\b(depart|departs|departure)\b/.test(lower) || /^depart/.test(lower)) return 'departure';
  if (/\b(arrive|arrives|arrival)\b/.test(lower) || /^arrive/.test(lower)) return 'arrival';

  return 'summary';
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
  // For flight_card, use the single activity's time
  if (item.kind === 'flight_card') {
    return parseActivityMinutes(item.activity.activity_time)
  }
  return null
}

function getSectionKey(minutes: number | null): TimeOfDayKey {
  if (minutes === null) return 'flexible'
  if (minutes >= 300 && minutes <= 719) return 'morning'
  if (minutes >= 720 && minutes <= 1079) return 'afternoon'
  return 'evening'
}

export function transformItineraryDayActivities(activities: any[]): {
  orderedItems: ItineraryTimelineItem[];
  sections: TimeOfDaySection[];
} {
  const flightTimelineItems: ItineraryTimelineItem[] = [];
  const standaloneItems: ItineraryTimelineItem[] = [];

  activities.forEach((activity, index) => {
    if (isLikelyFlight(activity)) {
      // Use detectFlightRole to split into departure/arrival if possible
      const role = detectFlightRole(activity);
      flightTimelineItems.push({
        kind: 'flight_card',
        activity,
        originalIndex: -1000 + index, // ensure flight is always first
        sortMinutes: parseActivityMinutes(activity.activity_time),
        role,
        meta: {
          flightNumber: extractFlightNumber(`${activity.title} ${activity.notes || ''}`.toUpperCase()),
          route: extractRoute(`${activity.title} ${activity.notes || ''}`.toUpperCase()),
        },
      });
    } else {
      standaloneItems.push({
        kind: 'activity',
        activity,
        originalIndex: index,
        sortMinutes: parseActivityMinutes(activity.activity_time),
      });
    }
  });

  // Sort all items by time and original index, do not force flight_card to start
  const orderedItems = [...flightTimelineItems, ...standaloneItems].sort((a, b) => {
    const aTime = getItemPrimaryTime(a);
    const bTime = getItemPrimaryTime(b);
    if (aTime !== null && bTime !== null) {
      if (aTime !== bTime) return aTime - bTime;
      return a.originalIndex - b.originalIndex;
    }
    if (aTime !== null) return -1;
    if (bTime !== null) return 1;
    return a.originalIndex - b.originalIndex;
  });

  // Sectioning
  const sectionsByKey = new Map<TimeOfDayKey, ItineraryTimelineItem[]>([
    ['morning', []],
    ['afternoon', []],
    ['evening', []],
    ['flexible', []],
  ]);
  for (const item of orderedItems) {
    const key = getSectionKey(getItemPrimaryTime(item));
    sectionsByKey.get(key)?.push(item);
  }
  const sections: TimeOfDaySection[] = (['morning', 'afternoon', 'evening', 'flexible'] as TimeOfDayKey[])
    .map((key) => ({
      key,
      label: SECTION_LABELS[key],
      items: sectionsByKey.get(key) || [],
    }))
    .filter((section) => section.items.length > 0);
  return { orderedItems, sections };
}

export type FlightRole = 'departure' | 'arrival'
