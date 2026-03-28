import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import type { FlightRole, ItineraryActivity } from '@/lib/trips/itinerary-transform'

type FlightMeta = {
  airline?: string
  flightNumber?: string
  route?: string
}

type FlightActivityCardProps = {
  tripId: string
  dayId: string
  activity: ItineraryActivity
  role: FlightRole
  meta: FlightMeta
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return value
  const hour24 = Number(match[1])
  const minute = match[2]
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minute} ${ampm}`
}

function rolelabel(role: FlightRole): string {
  return role === 'departure' ? 'Departure' : 'Arrival'
}

function roleAccentClasses(role: FlightRole): {
  badge: string
  icon: string
  cardBorder: string
} {
  if (role === 'departure') {
    return {
      badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
      icon: 'text-sky-500',
      cardBorder: 'border-sky-100 bg-sky-50/40 hover:bg-sky-50/70',
    }
  }
  return {
    badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    icon: 'text-indigo-400',
    cardBorder: 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50/60',
  }
}

export default function FlightActivityCard({
  tripId,
  dayId,
  activity,
  role,
  meta,
}: FlightActivityCardProps) {
  const cls = roleAccentClasses(role)

  const subtitleParts = [
    meta.airline,
    meta.flightNumber,
    meta.route,
  ].filter(Boolean)

  return (
    <div
      className={`rounded-[1.4rem] border p-4 transition-colors ${cls.cardBorder}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + content */}
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-0.5 text-xl leading-none ${cls.icon}`} aria-hidden="true">
            ✈️
          </span>

          <div className="min-w-0 space-y-0.5">
            {/* Role label */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {rolelabel(role)}
            </p>

            {/* Airport / city title */}
            <p className="text-base font-semibold leading-snug text-slate-900 sm:text-[1.05rem]">
              {activity.title}
            </p>

            {/* Airline · Flight number · Route */}
            {subtitleParts.length > 0 ? (
              <p className="text-xs text-slate-500">{subtitleParts.join(' · ')}</p>
            ) : null}
          </div>
        </div>

        {/* Right: time + badge */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${cls.badge}`}
          >
            Flight
          </span>
          {activity.activity_time ? (
            <span className="text-sm font-semibold tabular-nums text-slate-900">
              {formatTime(activity.activity_time)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Edit link */}
      <div className="mt-3">
        <Link
          href={`/trips/${tripId}/itinerary/${dayId}/activities/${activity.id}/edit`}
          className={buttonClass({
            size: 'sm',
            variant: 'ghost',
            className: 'h-7 rounded-full px-3 text-xs text-slate-500 hover:bg-slate-100',
          })}
        >
          Edit
        </Link>
      </div>
    </div>
  )
}
