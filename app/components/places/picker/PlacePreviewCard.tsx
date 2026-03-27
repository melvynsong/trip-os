'use client'

import { getPlaceTypeEmoji, getPlaceTypeLabel, type PlaceType } from '@/lib/places'
import PlaceMapPreview from '@/app/components/places/picker/PlaceMapPreview'

export type SelectedPlaceDetails = {
  name: string
  address: string
  latitude: number
  longitude: number
  external_place_id: string
  city: string | null
  country: string | null
}

type PlacePreviewCardProps = {
  placeType: PlaceType
  place: SelectedPlaceDetails
  onClear: () => void
}

export default function PlacePreviewCard({ placeType, place, onClear }: PlacePreviewCardProps) {
  return (
    <div className="max-w-full space-y-3 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">
            {getPlaceTypeEmoji(placeType)} {place.name}
          </h3>
          <p className="mt-1 break-words text-sm text-gray-600">{place.address}</p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
        <div>
          <span className="font-medium">Type:</span> {getPlaceTypeLabel(placeType)}
        </div>
        <div>
          <span className="font-medium">External ID:</span> {place.external_place_id}
        </div>
        <div>
          <span className="font-medium">Coordinates:</span> {place.latitude.toFixed(6)},{' '}
          {place.longitude.toFixed(6)}
        </div>
        <div>
          <span className="font-medium">City/Country:</span>{' '}
          {[place.city, place.country].filter(Boolean).join(', ') || 'Unknown'}
        </div>
      </div>

      <PlaceMapPreview latitude={place.latitude} longitude={place.longitude} label={place.name} />
    </div>
  )
}
