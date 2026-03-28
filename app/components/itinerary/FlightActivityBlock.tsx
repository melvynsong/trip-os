import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import type { FlightActivityGroup } from '@/lib/trips/itinerary-transform'

type FlightActivityBlockProps = {
  tripId: string
  dayId: string
  group: FlightActivityGroup
}

function formatTime(value: string | null | undefined) {
  if (!value) return '—'
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return value
  const hour24 = Number(match[1])
  const minute = match[2]
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minute} ${ampm}`
}

function routeFromGroup(group: FlightActivityGroup): string | null {
  if (group.meta?.route) return group.meta.route

  const depNotes = group.departure?.notes || ''
  const arrNotes = group.arrival?.notes || ''
  const summaryNotes = group.summary?.notes || ''
  const combined = `${depNotes} ${arrNotes} ${summaryNotes}`.toUpperCase()
  const match = /\b([A-Z]{3})\s*→\s*([A-Z]{3})\b/.exec(combined)
  return match ? `${match[1]} → ${match[2]}` : null
}

export default function FlightActivityBlock({ tripId, dayId, group }: FlightActivityBlockProps) {
  const route = routeFromGroup(group)
  const subtitleParts = [group.meta?.airline, group.meta?.flightNumber, route].filter(Boolean)

  const departureId = group.departure?.id || group.summary?.id || null
  const arrivalId = group.arrival?.id && group.arrival.id !== departureId ? group.arrival.id : null

  const departureLabel = group.departure ? 'Depart' : group.summary ? 'Scheduled' : 'Depart'
  const arrivalLabel = group.arrival ? 'Arrive' : 'Arrive'

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:bg-sky-50/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900 sm:text-[1.1rem]">✈️ {group.title}</p>
          {subtitleParts.length > 0 ? (
            <p className="mt-1 text-sm text-slate-500">{subtitleParts.join(' • ')}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
          Flight
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{departureLabel}</p>
          <p className="mt-1 font-medium text-slate-900">{formatTime(group.departure?.activity_time || group.summary?.activity_time)}</p>
        </div>

        <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{arrivalLabel}</p>
          <p className="mt-1 font-medium text-slate-900">{formatTime(group.arrival?.activity_time)}</p>
        </div>
      </div>

      {(group.summary?.notes || group.departure?.notes || group.arrival?.notes) ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {group.summary?.notes || group.departure?.notes || group.arrival?.notes}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {departureId ? (
          <Link
            href={`/trips/${tripId}/itinerary/${dayId}/activities/${departureId}/edit`}
            className={buttonClass({ size: 'sm', variant: 'ghost', className: 'h-8 rounded-full text-xs text-slate-700 hover:bg-sky-50/70' })}
          >
            Edit flight
          </Link>
        ) : null}
        {arrivalId ? (
          <Link
            href={`/trips/${tripId}/itinerary/${dayId}/activities/${arrivalId}/edit`}
            className={buttonClass({ size: 'sm', variant: 'ghost', className: 'h-8 rounded-full text-xs text-slate-700 hover:bg-sky-50/70' })}
          >
            Edit arrival
          </Link>
        ) : null}
      </div>
    </div>
  )
}
