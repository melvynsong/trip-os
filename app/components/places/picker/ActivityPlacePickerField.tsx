'use client'

import GooglePlacePicker from '@/app/components/places/picker/GooglePlacePicker'
import { type PlaceType } from '@/lib/places'

type ActivityPlacePickerFieldProps = {
  tripId: string
  tripTitle: string
  destination: string
  initialPlaces: Array<{ id: string; name: string }>
  initialSelectedPlaceId?: string | null
  initialPlaceType?: PlaceType
}

export default function ActivityPlacePickerField({
  tripId,
  tripTitle,
  destination,
  initialSelectedPlaceId,
  initialPlaceType = 'attraction',
}: ActivityPlacePickerFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-strong)]">Place Search</label>
      <GooglePlacePicker
        tripId={tripId}
        tripTitle={tripTitle}
        destination={destination}
        initialPlaceType={initialPlaceType}
        hiddenInputName="place_id"
        initialSavedPlaceId={initialSelectedPlaceId}
        saveButtonText="Save and Attach Place"
      />
    </div>
  )
}
