'use client'

import StoryEngineSection, { type StoryEngineType } from '@/app/components/places/picker/StoryEngineSection'
import { type PlaceType } from '@/lib/places'

type ActivityPlacePickerFieldProps = {
  tripId: string
  tripTitle: string
  destination: string
  flightDate: string
  initialPlaces: Array<{ id: string; name: string }>
  initialSelectedPlaceId?: string | null
  initialPlaceType?: PlaceType
  selectedStoryType?: StoryEngineType
  onStoryTypeChange?: (value: StoryEngineType) => void
  canUseFlights?: boolean
  flightAccessMessage?: string | null
}

export default function ActivityPlacePickerField({
  tripId,
  tripTitle,
  destination,
  flightDate,
  initialSelectedPlaceId,
  initialPlaceType = 'attraction',
  selectedStoryType,
  onStoryTypeChange,
  canUseFlights = true,
  flightAccessMessage,
}: ActivityPlacePickerFieldProps) {
  return (
    <div className="space-y-2">
      <StoryEngineSection
        tripId={tripId}
        tripTitle={tripTitle}
        destination={destination}
        flightDate={flightDate}
        initialPlaceType={initialPlaceType}
        hiddenInputName="place_id"
        initialSavedPlaceId={initialSelectedPlaceId}
        saveButtonText="Save and Attach Place"
        selectedType={selectedStoryType}
        onTypeChange={onStoryTypeChange}
        canUseFlights={canUseFlights}
        flightAccessMessage={flightAccessMessage}
      />
    </div>
  )
}
