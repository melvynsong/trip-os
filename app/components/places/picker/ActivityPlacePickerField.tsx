'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FeatureComingSoon from '@/app/components/FeatureComingSoon'
import GooglePlacePicker from '@/app/components/places/picker/GooglePlacePicker'
import { PREMIUM_FIND_PLACE_TIERS, hasAccess } from '@/lib/membership/access'
import type { MembershipTier } from '@/lib/membership/types'
import { type PlaceType } from '@/lib/places'
import PlaceTypeSelector from '@/app/components/places/picker/PlaceTypeSelector'
import PlaceAutocompleteInput from '@/app/components/places/picker/PlaceAutocompleteInput'
import PlaceSearchResults, { type PlaceSuggestion } from '@/app/components/places/picker/PlaceSearchResults'
import PlacePreviewCard, { type SelectedPlaceDetails } from '@/app/components/places/picker/PlacePreviewCard'

type PlaceOption = {
  id: string
  name: string
}

type ActivityPlacePickerFieldProps = {
  tripId: string
  destination: string
  initialPlaces: PlaceOption[]
  initialSelectedPlaceId?: string | null
  initialPlaceType?: PlaceType
  userTier?: MembershipTier
}

const MIN_QUERY_LENGTH = 3

const COPY = {
  title: 'Google Search & Maps',
  freeDescription:
    'Upgrade to Friend to unlock smarter place search with maps, ratings, and better discovery.',
  ctaText: 'Upgrade to Friend',
} as const

export default function ActivityPlacePickerField({
  tripId,
  destination,
  initialPlaces,
  initialSelectedPlaceId,
  initialPlaceType = 'attraction',
  userTier = 'free',
}: ActivityPlacePickerFieldProps) {
  const [placeId, setPlaceId] = useState(initialSelectedPlaceId || '')
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>(initialPlaces)

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [placeType, setPlaceType] = useState<PlaceType>(initialPlaceType)

  const [query, setQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])

  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceDetails | null>(null)

  const [manualName, setManualName] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualNotes, setManualNotes] = useState('')

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const activeController = useRef<AbortController | null>(null)

  const hasQuery = query.trim().length > 0
  const minCharsMet = query.trim().length >= MIN_QUERY_LENGTH

  const sortedOptions = useMemo(() => {
    return [...placeOptions].sort((a, b) => a.name.localeCompare(b.name))
  }, [placeOptions])

  const isPremiumUser = hasAccess(userTier, PREMIUM_FIND_PLACE_TIERS)

  useEffect(() => {
    if (!showQuickAdd || mode !== 'search') {
      return
    }

    setSearchError(null)

    if (!minCharsMet) {
      setSuggestions([])
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
          q: query.trim(),
          placeType,
          destination,
        })

        const response = await fetch(`/api/places/autocomplete?${params.toString()}`, {
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to search places.')
        }

        setSuggestions(payload.suggestions || [])
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        setSearchError(error instanceof Error ? error.message : 'Failed to search places.')
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, placeType, destination, minCharsMet, mode, showQuickAdd])

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    setDetailsLoading(true)
    setDetailsError(null)
    setSaveError(null)

    try {
      const params = new URLSearchParams({ placeId: suggestion.placeId })
      const response = await fetch(`/api/places/details?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch place details.')
      }

      setSelectedPlace(payload.place)
      setQuery(suggestion.description)
    } catch (error) {
      setSelectedPlace(null)
      setDetailsError(error instanceof Error ? error.message : 'Failed to load place details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  async function saveGooglePlace() {
    if (!selectedPlace) return

    setSaveLoading(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_type: placeType,
          name: selectedPlace.name,
          address: selectedPlace.address,
          city: selectedPlace.city,
          country: selectedPlace.country,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          external_place_id: selectedPlace.external_place_id,
          source: 'openstreetmap',
          notes: null,
          visited: false,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save place.')
      }

      const inserted = payload.place as PlaceOption

      setPlaceOptions((current) => {
        if (current.some((place) => place.id === inserted.id)) {
          return current
        }
        return [...current, { id: inserted.id, name: inserted.name }]
      })
      setPlaceId(inserted.id)
      setShowQuickAdd(false)
      setMode('search')
      setQuery('')
      setSuggestions([])
      setSelectedPlace(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save place.')
    } finally {
      setSaveLoading(false)
    }
  }

  async function saveManualPlace() {
    if (!manualName.trim()) return

    setSaveLoading(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_type: placeType,
          name: manualName.trim(),
          address: manualAddress.trim() || null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          external_place_id: null,
          source: 'manual',
          notes: manualNotes.trim() || null,
          visited: false,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save place.')
      }

      const inserted = payload.place as PlaceOption

      setPlaceOptions((current) => {
        if (current.some((place) => place.id === inserted.id)) {
          return current
        }
        return [...current, { id: inserted.id, name: inserted.name }]
      })
      setPlaceId(inserted.id)
      setShowQuickAdd(false)
      setMode('search')
      setManualName('')
      setManualAddress('')
      setManualNotes('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save place.')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {isPremiumUser ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Place Search</label>

          <GooglePlacePicker
            tripId={tripId}
            destination={destination}
            initialPlaceType={placeType}
            hiddenInputName="place_id"
            activityTypeInputName="type"
            initialSavedPlaceId={initialSelectedPlaceId}
            saveButtonText="Save and Attach Place"
          />
        </div>
      ) : (
        <>
          <input type="hidden" name="place_id" value={placeId} />

          <div>
            <label className="mb-1 block text-sm font-medium">Saved Place (optional)</label>
            <select
              value={placeId}
              onChange={(event) => setPlaceId(event.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="">— None —</option>
              {sortedOptions.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>

          {!showQuickAdd ? (
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="rounded-xl border px-3 py-1.5 text-sm"
            >
              + Add New Place Inline
            </button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-dashed p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Quick Add Place</p>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  Close
                </button>
              </div>

              <PlaceTypeSelector value={placeType} onChange={setPlaceType} />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    mode === 'search'
                      ? 'bg-black text-white'
                      : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    mode === 'manual'
                      ? 'bg-black text-white'
                      : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  Manual
                </button>
              </div>

              {mode === 'search' ? (
                <div className="space-y-3">
                  <PlaceAutocompleteInput
                    value={query}
                    onChange={setQuery}
                    loading={searchLoading}
                    disabled={saveLoading}
                  />

                  <PlaceSearchResults
                    suggestions={suggestions}
                    loading={searchLoading}
                    error={searchError}
                    minCharsMet={minCharsMet}
                    hasQuery={hasQuery}
                    onSelect={handleSelectSuggestion}
                  />

                  {detailsLoading ? (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-gray-500">
                      Fetching place details…
                    </div>
                  ) : null}

                  {detailsError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {detailsError}
                    </div>
                  ) : null}

                  {selectedPlace ? (
                    <PlacePreviewCard
                      placeType={placeType}
                      place={selectedPlace}
                      onClear={() => setSelectedPlace(null)}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={saveGooglePlace}
                    disabled={!selectedPlace || saveLoading}
                    className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving…' : 'Save and Select Place'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Place Name</label>
                    <input
                      value={manualName}
                      onChange={(event) => setManualName(event.target.value)}
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="e.g. Hidden ramen spot"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Address (optional)</label>
                    <input
                      value={manualAddress}
                      onChange={(event) => setManualAddress(event.target.value)}
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
                    <textarea
                      rows={3}
                      value={manualNotes}
                      onChange={(event) => setManualNotes(event.target.value)}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={saveManualPlace}
                    disabled={!manualName.trim() || saveLoading}
                    className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving…' : 'Save and Select Place'}
                  </button>
                </div>
              )}

              {saveError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}
            </div>
          )}

          <FeatureComingSoon
            title={COPY.title}
            description={COPY.freeDescription}
            userTier={userTier}
            allowedTiers={PREMIUM_FIND_PLACE_TIERS}
            ctaText={COPY.ctaText}
            previewMode="place-discovery"
            className="mt-1"
          />
        </>
      )}
    </div>
  )
}
