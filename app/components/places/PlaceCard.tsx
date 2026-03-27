'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Place as PlaceType } from '@/types/trip'
import { getPlaceTypeEmoji, getPlaceTypeLabel, resolvePlaceType } from '@/lib/places'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import StoryListSection from '@/app/components/story/StoryListSection'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'

type PlaceCardPlace = Pick<
  PlaceType,
  | 'id'
  | 'trip_id'
  | 'name'
  | 'category'
  | 'place_type'
  | 'address'
  | 'city'
  | 'country'
  | 'latitude'
  | 'longitude'
  | 'source'
  | 'notes'
  | 'visited'
>

type PlaceCardProps = {
  place: PlaceCardPlace
  tripId: string
}

export default function PlaceCard({ place, tripId }: PlaceCardProps) {
  const placeType = resolvePlaceType(place)
  const [storyRefreshKey, setStoryRefreshKey] = useState(0)

  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl flex-shrink-0">{getPlaceTypeEmoji(placeType)}</span>
            <h3 className="font-semibold text-lg truncate">{place.name}</h3>
            {place.visited ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Visited
              </span>
            ) : null}
          </div>

          {place.address && (
            <p className="mt-1 text-sm text-gray-600">{place.address}</p>
          )}

          {(place.city || place.country) && (
            <p className="mt-1 text-xs text-gray-500">
              {[place.city, place.country].filter(Boolean).join(', ')}
            </p>
          )}

          {place.notes && (
            <p className="mt-2 text-sm text-gray-700">{place.notes}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="capitalize">{getPlaceTypeLabel(placeType)}</span>
            <span>•</span>
            <span>{place.source || 'manual'}</span>
          </div>

          {typeof place.latitude === 'number' && typeof place.longitude === 'number' ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ size: 'sm', className: 'mt-2 inline-flex h-8 px-2.5 text-xs' })}
            >
              Open Map ↗
            </a>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <StoryGenerationSheet
            tripId={tripId}
            scope="place"
            placeId={place.id}
            title={`Write Story: ${place.name}`}
            triggerLabel="Write Story"
            triggerClassName={`${buttonClass({ size: 'sm' })} whitespace-nowrap`}
            onSaved={() => setStoryRefreshKey((k) => k + 1)}
          />
          <Link
            href={`/trips/${tripId}/places/${place.id}/edit`}
            className={`${buttonClass({ size: 'sm' })} whitespace-nowrap`}
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <StoryListSection
          tripId={tripId}
          scope="place"
          placeId={place.id}
          title="Saved Place Stories"
          refreshKey={storyRefreshKey}
          limit={3}
        />
      </div>
    </Card>
  )
}
