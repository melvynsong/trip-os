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
    <Card className="overflow-hidden border border-[var(--border-soft)] p-0 shadow-[0_14px_40px_rgba(20,33,61,0.10)] bg-white">
      <div className="px-6 py-7 bg-[#E74646] text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80 mb-1">Trip Dashboard</div>
        <h1 className="text-3xl font-bold leading-tight mb-1">{destination}</h1>
        <div className="text-sm opacity-90 mb-2">{dateRangeLabel}</div>
        <div className="text-base opacity-85 mb-2">{tripTitle}</div>
        <div className="text-sm opacity-90">🏨 {hotel || 'Hotel not added yet'}</div>
      </div>
      <div className="flex flex-wrap gap-3 px-6 py-4 bg-white">
        <Link
          href={`/trips/${tripId}/today`}
          className={buttonClass({
            variant: 'secondary',
            className: 'border-[#E74646] text-[#E74646] bg-white hover:bg-[#fbeaea] active:bg-[#f6d6d6] font-semibold',
          })}
        >
          View Today
        </Link>
        <Link
          href={`/trips/${tripId}/itinerary`}
          className={buttonClass({
            variant: 'primary',
            className: 'bg-[#E74646] text-white border-[#E74646] hover:bg-[#eb8888] active:bg-[#e74646]/90 font-semibold',
          })}
        >
          Open Itinerary
        </Link>
        {shareButton}
      </div>
    </Card>
  )
}
