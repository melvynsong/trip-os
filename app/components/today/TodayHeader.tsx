'use client'

type TodayHeaderProps = {
  destination: string
  tripTitle: string
  date: string
  dayTitle: string | null
  dayNumber: number
  hotel: string | null
  tripStatus: 'upcoming' | 'active' | 'past'
}

const STATUS_BADGE: Record<TodayHeaderProps['tripStatus'], string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past: 'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<TodayHeaderProps['tripStatus'], string> = {
  upcoming: 'Upcoming',
  active: 'Travelling',
  past: 'Past trip',
}

export default function TodayHeader({
  destination,
  tripTitle,
  date,
  dayTitle,
  dayNumber,
  hotel,
  tripStatus,
}: TodayHeaderProps) {
  const normalizedDayTitle =
    dayTitle && !new RegExp(`^\\s*day\\s*${dayNumber}\\b`, 'i').test(dayTitle)
      ? dayTitle
      : null

  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[tripStatus]}`}
            >
              {STATUS_LABEL[tripStatus]}
            </span>
            <span className="text-sm text-gray-400">{tripTitle}</span>
          </div>

          <h1 className="mt-1.5 text-2xl font-bold leading-tight">
            Day {dayNumber}
            {normalizedDayTitle ? ` — ${normalizedDayTitle}` : ''}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>📍 {destination}</span>
            <span>·</span>
            <span>{formatted}</span>
          </div>

          {hotel && (
            <div className="mt-1.5 text-sm text-gray-500">
              🏨 {hotel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
