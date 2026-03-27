import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import DestinationCoverArt from '@/app/components/trips/story/DestinationCoverArt'
import { formatDisplayDateRange } from '@/lib/trip-storytelling'

export default function TripHeader({
  trip,
}: {
  trip: {
    id: string
    title: string
    destination: string
    startDate: string
    endDate: string
    coverImage: string | null
  }
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-[0_2px_20px_rgba(28,25,23,0.07)]">
      <div
        className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12"
        style={
          trip.coverImage
            ? {
                backgroundImage: `linear-gradient(180deg,rgba(15,23,42,0.24),rgba(15,23,42,0.62)), url(${trip.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!trip.coverImage ? <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(30,107,114,0.1),transparent_56%)]" /> : null}
        {!trip.coverImage ? (
          <DestinationCoverArt destination={trip.destination} title={trip.title} showLabel={false} />
        ) : null}
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center rounded-full border border-[var(--border-soft)]/60 bg-[var(--surface-panel)]/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-subtle)] backdrop-blur">
            This is your story
          </div>
          <div className="space-y-3">
            <p className={`text-sm font-medium ${trip.coverImage ? 'text-slate-100/90' : 'text-[var(--text-subtle)]'}`}>
              {trip.destination} · {formatDisplayDateRange(trip.startDate, trip.endDate)}
            </p>
            <h1 className={`font-serif text-4xl leading-tight sm:text-5xl ${trip.coverImage ? 'text-white' : 'text-[var(--text-strong)]'}`}>
              {trip.title}
            </h1>
          </div>
          <div className="hidden flex-wrap gap-3 pt-2 sm:flex">
            <Link
              href="#trip-story-generator"
              className={buttonClass({ variant: 'primary', className: 'rounded-full' })}
            >
              Turn this into a story
            </Link>
            <Link
              href={`/trips/${trip.id}/itinerary`}
              className={buttonClass({ variant: 'secondary', className: 'rounded-full border-white/50 bg-white/85 text-slate-800 hover:bg-white' })}
            >
              Continue planning
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[var(--border-soft)] px-6 py-4 sm:hidden">
        <Link
          href="#trip-story-generator"
          className={buttonClass({ variant: 'primary', className: 'w-full rounded-full' })}
        >
          Turn this into a story
        </Link>
        <Link
          href={`/trips/${trip.id}/itinerary`}
            className={buttonClass({ variant: 'secondary', className: 'w-full rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]' })}
        >
          Continue planning
        </Link>
      </div>
    </section>
  )
}
