import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'
import TimelineBlock from '@/app/components/trips/story/TimelineBlock'
import { formatDisplayDate, formatTimeLabel } from '@/lib/trip-storytelling'

type StoryMoment = {
  id: string
  title: string
  time: string | null
  location: string | null
  notes: string | null
}

type PeriodGroup = {
  label: string
  description: string
  items: StoryMoment[]
}

export default function DaySection({
  tripId,
  day,
  groups,
  isLast,
}: {
  tripId: string
  day: { id: string; dayNumber: number; date: string; title: string | null }
  groups: PeriodGroup[]
  isLast: boolean
}) {
  const hasMoments = groups.some((group) => group.items.length > 0)
  const normalizedDayTitle =
    day.title && !new RegExp(`^\\s*day\\s*${day.dayNumber}\\b`, 'i').test(day.title)
      ? day.title
      : null
  const heading = normalizedDayTitle ? `Day ${day.dayNumber} — ${normalizedDayTitle}` : `Day ${day.dayNumber}`

  return (
    <section className="space-y-6">
      {!isLast ? (
        <div className="flex items-center gap-4 text-[var(--text-subtle)]">
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
          <p className="text-xs font-medium uppercase tracking-[0.2em]">Another chapter begins.</p>
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
        </div>
      ) : null}

        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[0_2px_16px_rgba(28,25,23,0.06)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              {formatDisplayDate(day.date)}
            </p>
            <h2 className="font-serif text-3xl text-[var(--text-strong)]">{heading}</h2>
            <p className="text-sm leading-7 text-[var(--text-subtle)]">This is your story.</p>
          </div>
          <Link
            href={`/trips/${tripId}/itinerary`}
            className={buttonClass({ variant: 'secondary', className: 'rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]' })}
          >
            Continue your story
          </Link>
        </div>

        {hasMoments ? (
          <div className="mt-6 space-y-5">
            {groups.map((group) =>
              group.items.length > 0 ? (
                <TimelineBlock key={group.label} label={group.label} description={group.description}>
                  {group.items.map((item) => (
                    <Card key={item.id} className="rounded-xl border-[var(--border-soft)] bg-[var(--surface-panel)] p-4 shadow-none">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.time ? (
                              <span className="rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/20">
                                {formatTimeLabel(item.time)}
                              </span>
                            ) : null}
                            {item.location ? (
                              <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-subtle)]">
                                {item.location}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-base font-semibold text-[var(--text-strong)] sm:text-lg">{item.title}</h3>
                          {item.notes ? <p className="text-sm leading-7 text-[var(--text-subtle)]">{item.notes}</p> : null}
                        </div>
                      </div>
                    </Card>
                  ))}
                </TimelineBlock>
              ) : null
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)]/70 p-6 text-sm leading-7 text-[var(--text-subtle)]">
            <p className="font-medium text-[var(--text-strong)]">This part of your story is yet to be written.</p>
            <p className="mt-2">Add a moment to begin shaping this day.</p>
            <div className="mt-4">
              <Link
                href={`/trips/${tripId}/itinerary/${day.id}/new`}
                className={buttonClass({ variant: 'primary', className: 'rounded-full' })}
              >
                Add your first moment
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
