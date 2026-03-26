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
  upcoming: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
  active: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  past: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
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
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_46px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[tripStatus]}`}
            >
              {STATUS_LABEL[tripStatus]}
            </span>
            <span className="text-sm text-slate-400">{tripTitle}</span>
          </div>

          <h1 className="mt-2 font-serif text-4xl leading-tight text-slate-900 sm:text-[2.5rem]">
            Day {dayNumber}
            {normalizedDayTitle ? ` — ${normalizedDayTitle}` : ''}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 sm:text-base">
            <span>📍 {destination}</span>
            <span>·</span>
            <span>{formatted}</span>
          </div>

          {hotel && (
            <div className="mt-2 text-sm text-slate-500 sm:text-base">
              🏨 {hotel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
