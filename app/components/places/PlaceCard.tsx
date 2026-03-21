import Link from 'next/link'
import { Place as PlaceType } from '@/types/trip'

type PlaceCardPlace = Pick<
  PlaceType,
  'id' | 'trip_id' | 'name' | 'category' | 'address' | 'notes'
>

type PlaceCardProps = {
  place: PlaceCardPlace
  tripId: string
}

function getCategoryEmoji(category: string) {
  switch (category) {
    case 'food':
      return '🍜'
    case 'attraction':
      return '📍'
    case 'shopping':
      return '🛍️'
    case 'hotel':
      return '🏨'
    case 'other':
      return '📌'
    default:
      return '📌'
  }
}

export default function PlaceCard({ place, tripId }: PlaceCardProps) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getCategoryEmoji(place.category)}</span>
            <h3 className="font-semibold text-lg">{place.name}</h3>
          </div>

          {place.address && (
            <p className="mt-1 text-sm text-gray-600">{place.address}</p>
          )}

          {place.notes && (
            <p className="mt-2 text-sm text-gray-700">{place.notes}</p>
          )}

          <p className="mt-1 text-xs text-gray-500 capitalize">{place.category}</p>
        </div>

        <Link
          href={`/trips/${tripId}/places/${place.id}/edit`}
          className="rounded-lg border px-3 py-1 text-sm whitespace-nowrap"
        >
          Edit
        </Link>
      </div>
    </div>
  )
}
