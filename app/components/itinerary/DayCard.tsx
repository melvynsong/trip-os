import Link from 'next/link'
import type { ItineraryActivity } from '@/lib/trips/itinerary-transform'
import ItineraryActivityRenderer from '@/app/components/itinerary/ItineraryActivityRenderer'
import TimeOfDaySection from '@/app/components/itinerary/TimeOfDaySection'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'
import { formatDayForWhatsApp } from '@/lib/share/whatsapp'
import { transformActivitiesForTimeline } from '@/lib/trips/timeline-shared'
import { Day as DayType, Activity as ActivityType } from '@/types/trip'
import { format, parseISO } from 'date-fns'

type DayCardDay = Pick<DayType, 'id' | 'trip_id' | 'day_number' | 'date' | 'title'>

type DayCardActivity = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'sort_order' | 'place_id' | 'created_at'
> & {
  places: { id: string; name: string } | null
}

type DayCardProps = {
  tripId: string
  tripTitle: string
  destination: string
  hotel: string | null
  day: DayCardDay
  activities: DayCardActivity[]
  flights?: any[]
  moveActivityAction: (formData: FormData) => Promise<void>
}

export default function DayCard({
  tripId,
  tripTitle,
  destination,
  hotel,
  day,
  activities,
  flights = [],
  moveActivityAction,
}: DayCardProps) {
  const normalizedDayTitle =
    day.title && !new RegExp(`^\\s*day\\s*${day.day_number}\\b`, 'i').test(day.title)
      ? day.title
      : null

  // Helper to extract date (YYYY-MM-DD) from ISO or offset string
  function extractDate(dateTime: string) {
    // Handles both '2026-04-08 19:50+08:00' and ISO
    return dateTime.split(' ')[0]
  }
  // Helper to format time nicely
  function formatTime(dateTime: string) {
    try {
      // Handles '2026-04-08 19:50+08:00'
      const timePart = dateTime.split(' ')[1]
      if (!timePart) return dateTime
      const [hm] = timePart.split('+')
      const [hour, minute] = hm.split(':')
      const hourNum = parseInt(hour, 10)
      const ampm = hourNum >= 12 ? 'PM' : 'AM'
      const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12
      return `${hour12}:${minute} ${ampm}`
    } catch {
      return dateTime
    }
  }
  // Helper to format date nicely
  function formatDate(dateTime: string) {
    try {
      const datePart = dateTime.split(' ')[0]
      return format(parseISO(datePart), 'EEE, d MMM yyyy')
    } catch {
      return dateTime
    }
  }

  // Transform flights into valid ItineraryActivity objects for this day
  const flightActivities = (flights || []).flatMap(flight => {
    const items = []
    // Departure card on departure date
    if (flight.departureTime) {
      const depDate = extractDate(flight.departureTime)
      if (depDate === day.date) {
        items.push({
          id: `flight-dep-${flight.id}`,
          day_id: day.id,
          title: `${flight.departureAirportName} → ${flight.arrivalAirportName}`,
          activity_time: formatTime(flight.departureTime),
          type: 'transport',
          notes: `Departs ${flight.departureAirportName} (${flight.departureAirportCode})\n${formatDate(flight.departureTime)} at ${formatTime(flight.departureTime)}`,
          sort_order: 0,
          place_id: null,
          created_at: flight.updatedAt,
          places: null,
        } as ItineraryActivity)
      }
    }
    // Arrival card on arrival date
    if (flight.arrivalTime) {
      const arrDate = extractDate(flight.arrivalTime)
      if (arrDate === day.date) {
        items.push({
          id: `flight-arr-${flight.id}`,
          day_id: day.id,
          title: `${flight.departureAirportName} → ${flight.arrivalAirportName}`,
          activity_time: formatTime(flight.arrivalTime),
          type: 'transport',
          notes: `Arrives at ${flight.arrivalAirportName} (${flight.arrivalAirportCode})\n${formatDate(flight.arrivalTime)} at ${formatTime(flight.arrivalTime)}`,
          sort_order: 0,
          place_id: null,
          created_at: flight.updatedAt,
          places: null,
        } as ItineraryActivity)
      }
    }
    return items
  })

  // Merge activities and flightActivities
  const allActivities = [...activities, ...flightActivities]

  const { orderedItems, sections } = transformActivitiesForTimeline(allActivities)

  const shareActivities = orderedItems.map((item) => {
    if (item.kind === 'activity') {
      return {
        title: item.activity.title,
        activity_time: item.activity.activity_time,
        type: item.activity.type,
        notes: item.activity.notes,
        placeName: item.activity.places?.name,
      }
    }
    // flight_card
    return {
      title: item.activity.title,
      activity_time: item.activity.activity_time,
      type: 'transport' as const,
      notes: [item.meta.airline, item.meta.flightNumber, item.meta.route].filter(Boolean).join(' • '),
      placeName: null,
    }
  })

  const shortShareText = formatDayForWhatsApp(
    {
      tripTitle,
      dayNumber: day.day_number,
      date: day.date,
      city: destination,
      hotel,
      title: day.title,
      activities: shareActivities,
    },
    { length: 'short' }
  )

  const detailedShareText = formatDayForWhatsApp(
    {
      tripTitle,
      dayNumber: day.day_number,
      date: day.date,
      city: destination,
      hotel,
      title: day.title,
      activities: shareActivities,
    },
    { length: 'detailed' }
  )

  // Find departure and arrival flights for this day
  const departureFlights = flights.filter(f => f.departureTime.startsWith(day.date))
  const arrivalFlights = flights.filter(f => f.arrivalTime.startsWith(day.date))

  return (
    <Card key={day.id} className="rounded-[2rem] border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="font-serif text-3xl text-slate-900">
            Day {day.day_number}
            {normalizedDayTitle ? ` — ${normalizedDayTitle}` : ''}
          </div>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{day.date}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StoryGenerationSheet
            tripId={tripId}
            scope="day"
            dayId={day.id}
            relatedDate={day.date}
            title={`Generate Day ${day.day_number} Story`}
            triggerLabel="Generate Day Story"
            triggerClassName={buttonClass({ size: 'sm', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          />
          <WhatsAppShareSheet
            title={`Share Day ${day.day_number}`}
            shortText={shortShareText}
            detailedText={detailedShareText}
            triggerLabel="Share"
            triggerClassName={buttonClass({ size: 'sm', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          />
          <Link
            href={`/trips/${tripId}/itinerary/${day.id}/new`}
            className={buttonClass({ size: 'sm', className: 'rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70' })}
          >
            + Add Activity
          </Link>
        </div>
      </div>

      {orderedItems.length > 0 ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <TimeOfDaySection key={section.key} label={section.label}>
              {section.items.map((item) => {
                const globalIndex = orderedItems.indexOf(item)
                const key =
                  item.kind === 'activity'
                    ? item.activity.id
                    : item.activity.id

                return (
                  <ItineraryActivityRenderer
                    key={key}
                    tripId={tripId}
                    dayId={day.id}
                    item={item}
                    canMoveUp={item.kind === 'activity' ? globalIndex > 0 : false}
                    canMoveDown={item.kind === 'activity' ? globalIndex < orderedItems.length - 1 : false}
                    moveActivityAction={moveActivityAction}
                  />
                )
              })}
            </TimeOfDaySection>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
          No activities yet
        </div>
      )}
      {/* Flight Departure Cards */}
      {departureFlights.map(flight => (
        <div key={flight.id + '-dep'} className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="font-semibold text-blue-900">✈️ Flight Departure</div>
          <div className="text-sm text-blue-800">{flight.airlineName} {flight.flightNumber} ({flight.airlineCode})</div>
          <div className="text-xs text-blue-700">From {flight.departureAirportName} ({flight.departureAirportCode}) at {formatTime(flight.departureTime)}</div>
          <div className="text-xs text-blue-700">To {flight.arrivalAirportName} ({flight.arrivalAirportCode})</div>
        </div>
      ))}
      {/* Flight Arrival Cards */}
      {arrivalFlights.map(flight => (
        <div key={flight.id + '-arr'} className="mb-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="font-semibold text-green-900">🛬 Flight Arrival</div>
          <div className="text-sm text-green-800">{flight.airlineName} {flight.flightNumber} ({flight.airlineCode})</div>
          <div className="text-xs text-green-700">Arrives at {flight.arrivalAirportName} ({flight.arrivalAirportCode}) at {formatTime(flight.arrivalTime)}</div>
          <div className="text-xs text-green-700">From {flight.departureAirportName} ({flight.departureAirportCode})</div>
        </div>
      ))}
    </Card>
  )
}
