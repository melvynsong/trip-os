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
    <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(41,31,24,0.08)]">
      <div
        className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12"
        style={
          trip.coverImage
            ? {
                backgroundImage: `linear-gradient(180deg,rgba(25,20,17,0.25),rgba(25,20,17,0.62)), url(${trip.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!trip.coverImage ? (
          <DestinationCoverArt destination={trip.destination} title={trip.title} />
        ) : null}
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-700 backdrop-blur">
            This is your story
          </div>
          <div className="space-y-3">
            <p className={`text-sm font-medium ${trip.coverImage ? 'text-stone-100/90' : 'text-stone-500'}`}>
              {trip.destination} · {formatDisplayDateRange(trip.startDate, trip.endDate)}
            </p>
            <h1 className={`font-serif text-4xl leading-tight sm:text-5xl ${trip.coverImage ? 'text-white' : 'text-stone-900'}`}>
              {trip.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="#trip-story-generator"
              className={buttonClass({ variant: 'primary', className: 'rounded-full bg-stone-900 text-white hover:bg-stone-800' })}
            >
              Turn this into a story
            </Link>
            <Link
              href={`/trips/${trip.id}/itinerary`}
              className={buttonClass({ variant: 'secondary', className: 'rounded-full border-white/50 bg-white/80 text-stone-800 hover:bg-white' })}
            >
              Continue planning
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
