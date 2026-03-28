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
    <Card className="overflow-hidden border border-[var(--border-soft)] p-0 shadow-[0_14px_40px_rgba(20,33,61,0.16)]">
      <div className="relative bg-[linear-gradient(140deg,#2f61ed_0%,#3368ff_48%,#2854d6_100%)] px-5 py-6 text-white sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">Trip Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{destination}</h1>
        <p className="mt-1 text-sm text-white/90">{dateRangeLabel}</p>
        <p className="mt-4 text-sm text-white/85">{tripTitle}</p>
        <div className="mt-2 inline-flex items-center rounded-full border border-white/35 bg-white/18 px-3 py-1 text-sm">
          🏨 {hotel || 'Hotel not added yet'}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/trips/${tripId}/today`}
            className={buttonClass({
              variant: 'secondary',
              className:
                '!border-white/70 !bg-white !text-[var(--text-strong)] hover:!bg-[#f1f4fb] active:!bg-[#e6ebf8]',
            })}
          >
            View Today
          </Link>
          <Link href={`/trips/${tripId}/itinerary`} className={buttonClass({ variant: 'secondary', className: 'border-white/45 bg-white/10 text-white hover:bg-white/20 active:bg-white/25' })}>
            Open Itinerary
          </Link>
          {shareButton}
        </div>
      </div>
    </Card>
  )
}
