'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/app/components/ui/Button'
import Chip from '@/app/components/ui/Chip'
import Card from '@/app/components/ui/Card'
import { useToast } from '@/app/components/ui/ToastProvider'
import { cn } from '@/lib/utils/cn'
import type { PlaceType } from '@/lib/places'
import type { GooglePlaceDetails, GooglePlaceSearchResult } from '@/lib/google-places'
import { PLACE_TYPE_OPTIONS } from '@/lib/places'

type SavedPlace = {
  id: string
  name: string
}

type ActivityType = 'food' | 'attraction' | 'shopping' | 'transport' | 'hotel' | 'note' | 'other'

function placeTypeToActivityType(pt: PlaceType): ActivityType {
  switch (pt) {
    case 'restaurant':
    case 'cafe':
      return 'food'
    case 'attraction':
      return 'attraction'
    case 'shopping':
      return 'shopping'
    case 'hotel':
      return 'hotel'
    default:
      return 'other'
  }
}

type GooglePlacePickerProps = {
  tripId: string
  destination: string
  initialPlaceType?: PlaceType
  hiddenInputName?: string
  activityTypeInputName?: string
  initialSavedPlaceId?: string | null
  afterSaveHref?: string
  saveButtonText?: string
  className?: string
}

const MIN_QUERY_LENGTH = 3

function defaultQueryForPlaceType(placeType: PlaceType) {
  switch (placeType) {
    case 'restaurant':
      return 'best restaurants'
    case 'cafe':
      return 'popular cafes'
    case 'hotel':
      return 'top hotels'
    case 'shopping':
      return 'shopping mall'
    case 'attraction':
      return 'top attractions'
    case 'other':
    default:
      return 'popular places'
  }
}

function formatRating(rating: number | null, total: number | null) {
  if (rating === null) return 'Rating not available yet'
  if (total === null) return `★ ${rating.toFixed(1)}`
  return `★ ${rating.toFixed(1)} · ${total.toLocaleString()} reviews`
}

function formatPrimaryType(place: GooglePlaceDetails | GooglePlaceSearchResult) {
  return place.primaryTypeDisplayName || place.primaryType || 'Place'
}

export default function GooglePlacePicker({
  tripId,
  destination,
  initialPlaceType = 'attraction',
  hiddenInputName,
  activityTypeInputName,
  initialSavedPlaceId = null,
  afterSaveHref,
  saveButtonText = 'Save Place',
  className,
}: GooglePlacePickerProps) {
  const router = useRouter()
  const { showToast } = useToast()

  const [placeType, setPlaceType] = useState<PlaceType>(initialPlaceType)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GooglePlaceSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedPlace, setSavedPlace] = useState<SavedPlace | null>(null)
  const [savedPlaceId, setSavedPlaceId] = useState(initialSavedPlaceId || '')
  const [sessionToken, setSessionToken] = useState('')

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const activeController = useRef<AbortController | null>(null)

  const trimmedQuery = query.trim()
  const hasTypedQuery = trimmedQuery.length > 0
  const minCharsMet = trimmedQuery.length >= MIN_QUERY_LENGTH
  const effectiveQuery = hasTypedQuery ? trimmedQuery : defaultQueryForPlaceType(placeType)
  const shouldSearch = !hasTypedQuery || minCharsMet
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || ''

  const mapEmbedUrl = useMemo(() => {
    if (!selectedPlace || !embedKey) return null
    const queryValue = `place_id:${selectedPlace.placeId}`
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(embedKey)}&q=${encodeURIComponent(queryValue)}`
  }, [embedKey, selectedPlace])

  useEffect(() => {
    setSelectedPlace(null)
    setDetailsError(null)
  }, [placeType])

  useEffect(() => {
    if (!query.trim()) {
      setSessionToken('')
      return
    }

    setSessionToken((current) => current || crypto.randomUUID())
  }, [query])

  useEffect(() => {
    setSearchError(null)

    if (!shouldSearch) {
      setResults([])
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      if (activeController.current) {
        activeController.current.abort()
      }

      const controller = new AbortController()
      activeController.current = controller
      setSearchLoading(true)

      try {
        const params = new URLSearchParams({
          q: effectiveQuery,
          destination,
          placeType,
        })

        if (sessionToken) {
          params.set('sessionToken', sessionToken)
        }

        const response = await fetch(`/api/google-places/search?${params.toString()}`, {
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to search Google places.')
        }

        setResults(payload.results || [])
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        setSearchError(error instanceof Error ? error.message : 'Failed to search Google places.')
      } finally {
        setSearchLoading(false)
      }
    }, 450)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [destination, effectiveQuery, placeType, sessionToken, shouldSearch])

  async function handleSelectResult(result: GooglePlaceSearchResult) {
    setSelectedPlace(null)
    setDetailsLoading(true)
    setDetailsError(null)
    setSaveError(null)

    try {
      const params = new URLSearchParams({ placeId: result.placeId })
      if (sessionToken) {
        params.set('sessionToken', sessionToken)
      }
      const response = await fetch(`/api/google-places/details?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load Google place details.')
      }

      setSelectedPlace(payload.place)
      setQuery(result.name)
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Failed to load Google place details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  async function saveSelectedPlace() {
    if (!selectedPlace) return

    setSaveLoading(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedPlace.name,
          place_type: placeType,
          address: selectedPlace.address,
          city: null,
          country: null,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
          external_place_id: selectedPlace.placeId,
          source: 'google',
          notes: null,
          visited: false,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save place.')
      }

      const place = payload.place as SavedPlace
      setSavedPlace(place)
      setSavedPlaceId(place.id)
      setSessionToken('')
      showToast(payload.existing ? 'Place already saved. Attached successfully.' : 'Google place saved.', 'success')

      if (afterSaveHref) {
        router.push(afterSaveHref)
        return
      }

      if (!hiddenInputName) {
        router.refresh()
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save place.')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {hiddenInputName ? <input type="hidden" name={hiddenInputName} value={savedPlaceId} /> : null}
      {activityTypeInputName ? (
        <input type="hidden" name={activityTypeInputName} value={placeTypeToActivityType(placeType)} />
      ) : null}

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Google Search & Maps</h3>
            <p className="mt-1 text-sm text-gray-500">
              Search Google places, review ratings, and save the right spot into your trip.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Place Type</label>
          <div className="flex flex-wrap gap-2">
            {PLACE_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={placeType === option.value}
                onClick={() => setPlaceType(option.value)}
                className="rounded-full"
              >
                <span className="mr-1">{option.emoji}</span>
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Search</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10"
            placeholder="Search places, restaurants, and attractions"
          />
          <p className="text-xs text-gray-400">
            Type at least {MIN_QUERY_LENGTH} characters to refine, or browse starter results for the selected place type.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-2">
              {searchLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                      <div className="h-3 w-40 rounded-full bg-gray-200" />
                      <div className="mt-2 h-2 w-56 rounded-full bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {searchError}
                </div>
              ) : !shouldSearch ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                  Keep typing to refine search near {destination}.
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                  No matching Google places found. Try a shorter or broader search.
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((result) => {
                    const isSelected = selectedPlace?.placeId === result.placeId
                    return (
                      <button
                        key={result.placeId}
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        className={cn(
                          'w-full rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md',
                          isSelected && 'border-violet-300 ring-2 ring-violet-100'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{result.name}</p>
                            <p className="mt-1 text-xs text-gray-500">{result.formattedAddress || 'Address available after selection'}</p>
                          </div>
                          <span className="rounded-full bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                            {formatPrimaryType(result)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {detailsLoading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                Loading place details…
              </div>
            ) : detailsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {detailsError}
              </div>
            ) : selectedPlace ? (
              <>
                {mapEmbedUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <iframe
                      title={`Map preview for ${selectedPlace.name}`}
                      src={mapEmbedUrl}
                      className="h-56 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : null}

                <Card className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{selectedPlace.name}</h4>
                      <p className="mt-1 text-sm text-gray-500">{selectedPlace.address}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                      {formatPrimaryType(selectedPlace)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-gray-50 px-2.5 py-1 ring-1 ring-inset ring-gray-200">
                      {formatRating(selectedPlace.rating, selectedPlace.userRatingsTotal)}
                    </span>
                    <span className="rounded-full bg-gray-50 px-2.5 py-1 ring-1 ring-inset ring-gray-200">
                      {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
                    </span>
                  </div>

                  {selectedPlace.googleMapsUri ? (
                    <a
                      href={selectedPlace.googleMapsUri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-medium text-violet-700 hover:text-violet-800"
                    >
                      Open in Google Maps →
                    </a>
                  ) : null}

                  {selectedPlace.types.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedPlace.types.slice(0, 4).map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-inset ring-gray-200"
                        >
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="primary"
                    onClick={saveSelectedPlace}
                    loading={saveLoading}
                    disabled={saveLoading}
                    className="w-full"
                  >
                    {saveButtonText}
                  </Button>

                  {saveError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {saveError}
                    </div>
                  ) : null}

                  {savedPlace ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Attached saved place: <span className="font-medium">{savedPlace.name}</span>
                    </div>
                  ) : null}
                </Card>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">
                Select a result to view Google place details, rating, and map preview before saving.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
