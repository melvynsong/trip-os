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
  const heading = day.title ? `Day ${day.dayNumber} — ${day.title}` : `Day ${day.dayNumber}`

  return (
    <section className="space-y-6">
      {!isLast ? (
        <div className="flex items-center gap-4 text-stone-400">
          <div className="h-px flex-1 bg-stone-200" />
          <p className="text-xs font-medium uppercase tracking-[0.2em]">Another chapter begins.</p>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(41,31,24,0.05)] sm:p-7">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {formatDisplayDate(day.date)}
            </p>
            <h2 className="font-serif text-3xl text-stone-900">{heading}</h2>
            <p className="text-sm leading-7 text-stone-600">This is your story.</p>
          </div>
          <Link
            href={`/trips/${tripId}/itinerary`}
            className={buttonClass({ variant: 'secondary', className: 'rounded-full border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100' })}
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
                    <Card key={item.id} className="rounded-[1.4rem] border-stone-200 bg-white p-4 shadow-none">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.time ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                                {formatTimeLabel(item.time)}
                              </span>
                            ) : null}
                            {item.location ? (
                              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                                {item.location}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-base font-semibold text-stone-900 sm:text-lg">{item.title}</h3>
                          {item.notes ? <p className="text-sm leading-7 text-stone-600">{item.notes}</p> : null}
                        </div>
                      </div>
                    </Card>
                  ))}
                </TimelineBlock>
              ) : null
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50/70 p-6 text-sm leading-7 text-stone-600">
            <p className="font-medium text-stone-800">This part of your story is yet to be written.</p>
            <p className="mt-2">Add a moment to begin shaping this day.</p>
            <div className="mt-4">
              <Link
                href={`/trips/${tripId}/itinerary/${day.id}/new`}
                className={buttonClass({ variant: 'primary', className: 'rounded-full bg-stone-900 text-white hover:bg-stone-800' })}
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
