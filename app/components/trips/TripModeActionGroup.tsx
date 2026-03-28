import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type TripModeActionGroupProps = {
  tripId: string
  className?: string
  itineraryClassName?: string
  storyClassName?: string
  primaryMode?: 'itinerary' | 'story'
}

export default function TripModeActionGroup({
  tripId,
  className,
  itineraryClassName,
  storyClassName,
  primaryMode = 'itinerary',
}: TripModeActionGroupProps) {
  const itineraryVariant = primaryMode === 'itinerary' ? 'primary' : 'secondary'
  const storyVariant = primaryMode === 'story' ? 'primary' : 'secondary'

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <Link
        href={`/trips/${tripId}/itinerary`}
        className={buttonClass({
          variant: itineraryVariant,
          className: cn('rounded-full', itineraryClassName),
        })}
      >
        Open Itinerary
      </Link>

      <Link
        href={`/trips/${tripId}`}
        className={buttonClass({
          variant: storyVariant,
          className: cn('rounded-full', storyClassName),
        })}
      >
        View Story
      </Link>
    </div>
  )
}
