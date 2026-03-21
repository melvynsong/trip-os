'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { type PlaceType } from '@/lib/places'
import PlaceTypeSelector from './PlaceTypeSelector'
import PlaceAutocompleteInput from './PlaceAutocompleteInput'
import PlaceSearchResults, { type PlaceSuggestion } from './PlaceSearchResults'
import PlacePreviewCard, { type SelectedPlaceDetails } from './PlacePreviewCard'

type AddPlaceDrawerProps = {
  tripId: string
  tripTitle: string
  destination: string
}

const MIN_QUERY_LENGTH = 3

export default function AddPlaceDrawer({ tripId, tripTitle, destination }: AddPlaceDrawerProps) {
  const router = useRouter()

  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [placeType, setPlaceType] = useState<PlaceType>('attraction')

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

  const minCharsMet = query.trim().length >= MIN_QUERY_LENGTH
  const hasQuery = query.trim().length > 0

  useEffect(() => {
    if (mode !== 'search') {
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
          method: 'GET',
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
  }, [query, placeType, destination, minCharsMet, mode])

  useEffect(() => {
    setSelectedPlace(null)
    setDetailsError(null)
    setSaveError(null)
  }, [placeType, mode])

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

  const canSaveSearchMode = Boolean(selectedPlace) && !saveLoading
  const canSaveManualMode = Boolean(manualName.trim()) && !saveLoading

  const modeDescription = useMemo(() => {
    if (mode === 'search') {
      return 'Search real places, select one, verify details, then save.'
    }

    return 'Can’t find it? Add it manually with required place type.'
  }, [mode])

  async function saveFromSearch() {
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

      router.push(`/trips/${tripId}/places`)
      router.refresh()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save place.')
    } finally {
      setSaveLoading(false)
    }
  }

  async function saveFromManual() {
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

      router.push(`/trips/${tripId}/places`)
      router.refresh()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save place.')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Add Place</h1>
            <p className="text-sm text-gray-500">{tripTitle}</p>
            <p className="mt-1 text-xs text-gray-500">{modeDescription}</p>
          </div>
        </div>

        <div className="space-y-5">
          <PlaceTypeSelector value={placeType} onChange={setPlaceType} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`rounded-full px-3 py-1.5 text-sm ${
                mode === 'search'
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Search Places
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-full px-3 py-1.5 text-sm ${
                mode === 'manual'
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Can’t find this place? Add manually
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
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border p-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Place Name</label>
                <input
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="e.g. Hidden Rooftop Cafe"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Address (optional)</label>
                <input
                  value={manualAddress}
                  onChange={(event) => setManualAddress(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
                <textarea
                  value={manualNotes}
                  onChange={(event) => setManualNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Hours, reservation notes, etc."
                />
              </div>
            </div>
          )}

          {saveError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/trips/${tripId}/places`)}
              className="rounded-xl border px-4 py-2 text-sm"
              disabled={saveLoading}
            >
              Cancel
            </button>

            {mode === 'search' ? (
              <button
                type="button"
                onClick={saveFromSearch}
                disabled={!canSaveSearchMode}
                className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveLoading ? 'Saving…' : 'Save Selected Place'}
              </button>
            ) : (
              <button
                type="button"
                onClick={saveFromManual}
                disabled={!canSaveManualMode}
                className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveLoading ? 'Saving…' : 'Save Manual Place'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
