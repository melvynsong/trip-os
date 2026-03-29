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
      /** A single departure or arrival flight activity, shown as its own card. */
      kind: 'flight_card'
      activity: ItineraryActivity
      role: FlightRole
      meta: {
        airline?: string
        flightNumber?: string
        route?: string
      }
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

export function transformItineraryDayActivities(activities: ItineraryActivity[]): {
  orderedItems: ItineraryTimelineItem[]
  sections: TimeOfDaySection[]
} {

  // --- Refactored flight grouping and timeline logic ---
  const flightGroups = new Map<string, {
    departure?: ItineraryActivity
    arrival?: ItineraryActivity
    meta: FlightActivityGroup['meta']
    originalIndex: number
    depDateTime?: string
    arrDateTime?: string
    durationMinutes?: number | null
  }>();

  const standaloneItems: ItineraryTimelineItem[] = [];


  activities.forEach((activity, index) => {
    const likelyFlight = isLikelyFlight(activity);
    const detectedRole = detectFlightRole(activity);
    console.log('[ItineraryDebug] Activity role detection:', {
      id: activity.id,
      title: activity.title,
      notes: activity.notes,
      likelyFlight,
      detectedRole
    });
    if (!likelyFlight) {
      standaloneItems.push({
        kind: 'activity',
        activity,
        originalIndex: index,
        sortMinutes: parseActivityMinutes(activity.activity_time),
      });
      return;
    }

    // Extract duration from notes if present
    const durationMatch = (activity.notes || '').match(/(\d+h\s*)?(\d+m)?/);
    const durationStr = durationMatch ? durationMatch[0] : null;
    const durationMinutes = parseFlightDuration(durationStr);
              detectedRole: detectFlightRole(activity)
    // Try to get explicit arrival time from notes (e.g. "Arrives: 2026-04-10T00:15:00")
    let explicitArrival: string | null = null;
    const explicitArrivalMatch = (activity.notes || '').match(/Arrives?:\s*([\dT:-]+)/i);
    if (explicitArrivalMatch) {
      explicitArrival = explicitArrivalMatch[1];
    }

    const key = resolveFlightKey(activity) || `single|${activity.id}`;
    const combined = `${activity.title} ${activity.notes || ''}`.toUpperCase();
    const airline = extractAirline((activity.notes || '').toUpperCase()) || undefined;
    const flightNumber = extractFlightNumber(combined) || undefined;
    const route = extractRoute(combined) || undefined;
    // Debug output for flight meta extraction
    console.log('[FlightMetaDebug]', {
      id: activity.id,
      combined,
      airline,
      flightNumber,
      route,
    });
    const meta = {
      airline,
      flightNumber,
      route,
    };

    const group = flightGroups.get(key) || {
      meta,
      originalIndex: index,
    };

    if (detectedRole === 'departure') {
      group.departure = activity;
      group.depDateTime = activity.created_at || undefined;
      group.durationMinutes = durationMinutes;

    } else if (detectedRole === 'arrival') {
      group.arrival = activity;
      // Do NOT use created_at as fallback for arrDateTime
      group.arrDateTime = undefined;
    }

    // If we have both, derive arrival datetime if needed
    if (group.departure && group.durationMinutes != null) {
      const depDateTime = group.departure.activity_time
        ? `${group.departure.created_at?.slice(0, 10) || ''}T${group.departure.activity_time}`
        : group.departure.created_at;
      group.arrDateTime = deriveFlightArrivalDateTime(depDateTime || '', group.durationMinutes, explicitArrival) || undefined;
    }

    flightGroups.set(key, group);
  });

  // Debug output for flight groups
  console.log('[ItineraryDebug] Flight Groups:', Array.from(flightGroups.entries()));

  // Emit only 2 cards per flight: departure and arrival, with correct day assignment
  const flightTimelineItems: ItineraryTimelineItem[] = [];
  for (const group of flightGroups.values()) {
    if (typeof group.departure !== 'undefined' && group.departure !== undefined) {
      const departure = group.departure as ItineraryActivity;
      flightTimelineItems.push({
        kind: 'flight_card',
        activity: departure,
        role: 'departure',
        meta: group.meta || {},
        originalIndex: group.originalIndex,
        sortMinutes: parseActivityMinutes(departure.activity_time),
      });
    }
    if (typeof group.arrival !== 'undefined' && group.arrival !== undefined) {
      const arrDateTime = group.arrDateTime;
      // Compute 24-hour time string from arrDateTime if available, else use activity_time or placeholder
      let arrival_time_24h = '';
      if (arrDateTime) {
        const arrDate = new Date(arrDateTime);
        if (!isNaN(arrDate.getTime())) {
          const hours = arrDate.getHours().toString().padStart(2, '0');
          const minutes = arrDate.getMinutes().toString().padStart(2, '0');
          arrival_time_24h = `${hours}:${minutes}`;
        } else {
          arrival_time_24h = '—';
          console.warn('[ItineraryDebug] Invalid arrDateTime for arrival:', arrDateTime, group);
        }
      } else if ((group.arrival as ItineraryActivity).activity_time) {
        arrival_time_24h = (group.arrival as ItineraryActivity).activity_time;
      } else {
        arrival_time_24h = '—';
        console.warn('[ItineraryDebug] Missing arrDateTime and activity_time for arrival:', group);
      }
      // Set day_id to the date part of arrDateTime (YYYY-MM-DD) for correct grouping if available
      let arrivalDayId = (group.arrival as ItineraryActivity).day_id;
      if (arrDateTime) {
        const arrDate = new Date(arrDateTime);
        if (!isNaN(arrDate.getTime())) {
          arrivalDayId = arrDate.toISOString().slice(0, 10);
        }
      }
      flightTimelineItems.push({
        kind: 'flight_card',
        activity: {
          ...(group.arrival as ItineraryActivity),
          day_id: arrivalDayId,
          activity_time: arrival_time_24h,
          arrival_datetime: arrDateTime,
        },
        role: 'arrival',
        meta: group.meta || {},
        originalIndex: group.originalIndex,
        sortMinutes: parseActivityMinutes(arrival_time_24h),
      });
    }
  }

  // DEBUG: Log flightTimelineItems
  console.log('[ItineraryDebug] flightTimelineItems:', flightTimelineItems.map(item => ({
    kind: item.kind,
    id: item.activity.id,
    role: item.kind === 'flight_card' ? item.role : undefined,
    type: item.activity.type,
    activity_time: item.activity.activity_time,
    title: item.activity.title,
    notes: item.activity.notes
  })));

  // --- FIX: Always include flightTimelineItems in orderedItems ---
  const orderedItems = [...standaloneItems, ...flightTimelineItems].sort((a, b) => {
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

  // --- FIX: Ensure flight_card items are included in sections ---
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
    .map((key) => ({
      key,
      label: SECTION_LABELS[key],
      items: sectionsByKey.get(key) || [],
    }))
    .filter((section) => section.items.length > 0);

  return { orderedItems, sections };
}

export type FlightRole = 'departure' | 'arrival'
