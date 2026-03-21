import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'

type TripHeroCardProps = {
  destination: string
  dateRangeLabel: string
  tripTitle: string
  hotel: string | null
  tripId: string
  shareButton?: React.ReactNode
}

export default function TripHeroCard({
  destination,
  dateRangeLabel,
  tripTitle,
  hotel,
  tripId,
  shareButton,
}: TripHeroCardProps) {
  return (
    <Card className="overflow-hidden border-0 p-0 shadow-md">
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-5 py-6 text-white sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">Trip Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{destination}</h1>
        <p className="mt-1 text-sm text-white/90">{dateRangeLabel}</p>
        <p className="mt-4 text-sm text-white/85">{tripTitle}</p>
        <div className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm">
          🏨 {hotel || 'Hotel not added yet'}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/trips/${tripId}/today`} className={buttonClass({ variant: 'primary', className: 'bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200' })}>
            View Today
          </Link>
          <Link href={`/trips/${tripId}/itinerary`} className={buttonClass({ variant: 'secondary', className: 'border-white/50 bg-white/10 text-white hover:bg-white/20' })}>
            View Itinerary
          </Link>
          {shareButton}
        </div>
      </div>
    </Card>
  )
}
