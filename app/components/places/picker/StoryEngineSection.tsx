'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ActivityFlightInput from '@/app/components/itinerary/ActivityFlightInput'
import Button from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'
import Chip from '@/app/components/ui/Chip'
import { useToast } from '@/app/components/ui/ToastProvider'
import { PLACE_TYPE_OPTIONS, type PlaceType } from '@/lib/places'
import { cn } from '@/lib/utils/cn'
import type { GooglePlaceDetails, GooglePlaceSearchResult } from '@/lib/google-places'

export type StoryEngineType = PlaceType | 'flight'

type SavedPlace = {
  id: string
  name: string
}

type StoryEngineSectionProps = {
  tripId: string
  tripTitle: string
  destination: string
  flightDate: string
  initialPlaceType?: PlaceType
  hiddenInputName?: string
  initialSavedPlaceId?: string | null
  afterSaveHref?: string
  saveButtonText?: string
  className?: string
  selectedType?: StoryEngineType
  onTypeChange?: (value: StoryEngineType) => void
  canUseFlights?: boolean
  flightAccessMessage?: string | null
}

const MIN_QUERY_LENGTH = 3

const STORY_ENGINE_OPTIONS: Array<{ value: StoryEngineType; label: string; emoji: string }> = [
  ...PLACE_TYPE_OPTIONS,
  { value: 'flight', label: 'Flight', emoji: '✈️' },
]

function isPlaceType(value: StoryEngineType): value is PlaceType {
  return value !== 'flight'
}

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

function placeTypeLabel(placeType: PlaceType) {
  return PLACE_TYPE_OPTIONS.find((option) => option.value === placeType)?.label || 'places'
}

function formatRating(rating: number | null, total: number | null) {
  if (rating === null) return 'Rating not available yet'
  if (total === null) return `★ ${rating.toFixed(1)}`
  return `★ ${rating.toFixed(1)} · ${total.toLocaleString()} reviews`
}

function formatPrimaryType(place: GooglePlaceDetails | GooglePlaceSearchResult) {
  return place.primaryTypeDisplayName || place.primaryType || 'Place'
}

export default function StoryEngineSection({
  tripId,
  tripTitle,
  destination,
  flightDate,
  initialPlaceType = 'attraction',
  hiddenInputName,
  initialSavedPlaceId = null,
  afterSaveHref,
  saveButtonText = 'Save and Attach Place',
  className,
  selectedType,
  onTypeChange,
  canUseFlights = true,
  flightAccessMessage,
}: StoryEngineSectionProps) {
  const router = useRouter()
  const { showToast } = useToast()

  const [storyType, setStoryType] = useState<StoryEngineType>(selectedType || initialPlaceType)
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

  const effectivePlaceType: PlaceType = isPlaceType(storyType) ? storyType : initialPlaceType
  const trimmedQuery = query.trim()
  const hasTypedQuery = trimmedQuery.length > 0
  const minCharsMet = trimmedQuery.length >= MIN_QUERY_LENGTH
  const starterQuery = `${tripTitle} ${placeTypeLabel(effectivePlaceType)} ${defaultQueryForPlaceType(effectivePlaceType)}`.trim()
  const effectiveQuery = hasTypedQuery ? trimmedQuery : starterQuery
  const searchMode = hasTypedQuery ? 'search' : 'starter'
  const shouldSearch = storyType !== 'flight' && (!hasTypedQuery || minCharsMet)
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || ''

  const visibleResults = useMemo(() => {
    if (storyType === 'flight') return []

    if (!hasTypedQuery || minCharsMet) {
      return results
    }

    const keyword = trimmedQuery.toLowerCase()
    return results
      .filter((result) => {
        const name = result.name.toLowerCase()
        const address = (result.formattedAddress || '').toLowerCase()
        return name.includes(keyword) || address.includes(keyword)
      })
      .slice(0, 5)
  }, [hasTypedQuery, minCharsMet, results, storyType, trimmedQuery])

  const mapEmbedUrl = useMemo(() => {
    if (!selectedPlace || !embedKey || storyType === 'flight') return null
    const queryValue = `place_id:${selectedPlace.placeId}`
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(embedKey)}&q=${encodeURIComponent(queryValue)}`
  }, [embedKey, selectedPlace, storyType])

  useEffect(() => {
    if (selectedType) {
      setStoryType(selectedType)
    }
  }, [selectedType])

  useEffect(() => {
    setSelectedPlace(null)
    setDetailsError(null)
    setSearchError(null)
    setSaveError(null)
  }, [storyType])

  useEffect(() => {
    if (storyType === 'flight') {
      return
    }

    if (!query.trim()) {
      setSessionToken('')
      return
    }

    setSessionToken((current) => current || crypto.randomUUID())
  }, [query, storyType])

  useEffect(() => {
    setSearchError(null)

    if (storyType === 'flight' || !shouldSearch) {
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
          placeType: effectivePlaceType,
          mode: searchMode,
        })

        if (sessionToken) {
          params.set('sessionToken', sessionToken)
        }

        const response = await fetch(`/api/google-places/search?${params.toString()}`, {
          credentials: 'include',
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
  }, [destination, effectivePlaceType, effectiveQuery, searchMode, sessionToken, shouldSearch, storyType])

  function handleStoryTypeChange(value: StoryEngineType) {
    setStoryType(value)
    onTypeChange?.(value)
  }

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
      const response = await fetch(`/api/google-places/details?${params.toString()}`, {
        credentials: 'include',
      })
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
    if (!selectedPlace || storyType === 'flight') return

    setSaveLoading(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: selectedPlace.name,
          place_type: effectivePlaceType,
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
      showToast(payload.existing ? 'Place already saved. Attached successfully.' : 'Place added to your story.', 'success')

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

  const helperText =
    storyType === 'flight'
      ? 'Add your flight details to place this journey into your story.'
      : 'Search for places, restaurants, and attractions.'

  return (
    <div className={cn('max-w-full space-y-4 overflow-x-hidden', className)}>
      {hiddenInputName ? <input type="hidden" name={hiddenInputName} value={savedPlaceId} /> : null}

      <Card className="max-w-full space-y-5 overflow-hidden rounded-[1.75rem] border-[var(--border-soft)] bg-white p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
            Story Engine
          </p>
          <div>
            <h3 className="text-xl font-serif text-[var(--text-strong)]">Story Engine</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-subtle)]">
              Add places, flights, and moments — and watch your trip come to life.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--text-strong)]">What would you like to add?</p>
          <div className="flex flex-wrap gap-2">
            {STORY_ENGINE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={storyType === option.value}
                onClick={() => handleStoryTypeChange(option.value)}
                className="rounded-full"
              >
                <span className="mr-1.5">{option.emoji}</span>
                {option.label}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-[var(--text-subtle)]">{helperText}</p>
        </div>

        {storyType === 'flight' ? (
          <ActivityFlightInput
            tripId={tripId}
            flightDate={flightDate}
            canUseFlights={canUseFlights}
            accessMessage={flightAccessMessage}
            className="border-0 bg-[var(--surface-muted)] p-4 shadow-none"
          />
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-strong)]">Search</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--border-soft)] bg-white px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)]"
                placeholder="Search for places, restaurants, and attractions"
              />
              <p className="text-xs text-[var(--text-subtle)]">
                Starter results are tailored from your trip title, destination, and selected story type. Type at least {MIN_QUERY_LENGTH} characters to refine.
              </p>
            </div>

            <div className="grid min-w-0 gap-4 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
              <div className="min-w-0 space-y-3 overflow-hidden">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-2">
                  {searchLoading ? (
                    <div className="space-y-2 p-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="rounded-xl border border-[var(--border-soft)] bg-white p-3 shadow-sm">
                          <div className="h-3 w-40 rounded-full bg-slate-200" />
                          <div className="mt-2 h-2 w-56 rounded-full bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  ) : searchError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {searchError}
                    </div>
                  ) : !shouldSearch && visibleResults.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--text-subtle)]">
                      Keep typing to refine the story near {destination}.
                    </div>
                  ) : visibleResults.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--text-subtle)]">
                      No matching places found yet. Try a broader search.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {visibleResults.map((result) => {
                        const isSelected = selectedPlace?.placeId === result.placeId
                        return (
                          <button
                            key={result.placeId}
                            type="button"
                            onClick={() => handleSelectResult(result)}
                            className={cn(
                              'w-full rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:shadow-md',
                              isSelected && 'border-[var(--brand-primary)]/40 ring-2 ring-[var(--ring-brand)]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--text-strong)]">{result.name}</p>
                                <p className="mt-1 break-words text-xs text-[var(--text-subtle)]">
                                  {result.formattedAddress || 'Address available after selection'}
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
                                  {formatRating(result.rating, result.userRatingsTotal)}
                                </p>
                              </div>
                              <span className="max-w-[42%] truncate rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-medium text-[var(--text-subtle)] ring-1 ring-inset ring-[var(--border-soft)]">
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

              <div className="min-w-0 space-y-3 overflow-hidden">
                {detailsLoading ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--text-subtle)]">
                    Loading place details…
                  </div>
                ) : detailsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {detailsError}
                  </div>
                ) : selectedPlace ? (
                  <>
                    {mapEmbedUrl ? (
                      <div className="max-w-full overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white shadow-sm">
                        <div className="aspect-[4/3] max-h-[420px] w-full sm:aspect-[16/10]">
                          <iframe
                            title={`Map preview for ${selectedPlace.name}`}
                            src={mapEmbedUrl}
                            className="block h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                    ) : null}

                    <Card className="space-y-3 overflow-hidden p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-base font-semibold text-[var(--text-strong)]">{selectedPlace.name}</h4>
                          <p className="mt-1 line-clamp-2 break-words text-sm text-[var(--text-subtle)]">{selectedPlace.address}</p>
                        </div>
                        <span className="max-w-[42%] truncate rounded-full bg-[var(--brand-accent-soft)] px-2 py-1 text-[11px] font-medium text-[var(--brand-accent)] ring-1 ring-inset ring-[var(--border-soft)]">
                          {formatPrimaryType(selectedPlace)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-subtle)]">
                        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 ring-1 ring-inset ring-[var(--border-soft)]">
                          {formatRating(selectedPlace.rating, selectedPlace.userRatingsTotal)}
                        </span>
                        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 ring-1 ring-inset ring-[var(--border-soft)]">
                          {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
                        </span>
                      </div>

                      {selectedPlace.googleMapsUri ? (
                        <a
                          href={selectedPlace.googleMapsUri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm font-medium text-[var(--brand-primary)] hover:opacity-80"
                        >
                          Open in Google Maps →
                        </a>
                      ) : null}

                      {selectedPlace.types.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedPlace.types.slice(0, 4).map((type) => (
                            <span
                              key={type}
                              className="max-w-full truncate rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-subtle)] ring-1 ring-inset ring-[var(--border-soft)]"
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
                  <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-white p-5 text-sm text-[var(--text-subtle)]">
                    Select a result to preview details, map context, and save the right stop into your story.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}