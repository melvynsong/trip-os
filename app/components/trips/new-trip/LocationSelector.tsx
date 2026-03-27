'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { TripLocation } from '../../../../lib/trips/locations'
import { isSameTripLocation, uniqueByPlaceId } from '../../../../lib/trips/locations'
import LocationSearchInput from './LocationSearchInput'
import SuggestionDropdown from './SuggestionDropdown'
import SelectedLocationChips from './SelectedLocationChips'

type LocationSelectorProps = {
  value: TripLocation[]
  onChange: (locations: TripLocation[]) => void
  disabled?: boolean
}

const DEBOUNCE_MS = 250

export default function LocationSelector({ value, onChange, disabled }: LocationSelectorProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TripLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)

  const requestIdRef = useRef(0)
  const inputId = 'locationSearchInput'

  const showDropdown = useMemo(
    () => query.trim().length >= 2 && (loading || suggestions.length >= 0),
    [loading, query, suggestions.length]
  )

  useEffect(() => {
    setDuplicateMessage(null)
  }, [query])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setLoading(true)

      try {
        const response = await fetch(`/api/locations/suggest?q=${encodeURIComponent(trimmed)}`, {
          credentials: 'include',
        })

        const payload = (await response.json()) as { suggestions?: TripLocation[]; error?: string }

        if (requestId !== requestIdRef.current) return

        if (!response.ok) {
          setSuggestions([])
          return
        }

        setSuggestions(payload.suggestions || [])
        setHighlightedIndex(0)
      } catch {
        if (requestId !== requestIdRef.current) return
        setSuggestions([])
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  function addLocation(nextLocation: TripLocation) {
    const alreadyExists = value.some((location) => isSameTripLocation(location, nextLocation))
    if (alreadyExists) {
      setDuplicateMessage('This destination is already added')
      return
    }

    onChange(uniqueByPlaceId([...value, nextLocation]))
    setQuery('')
    setSuggestions([])
    setDuplicateMessage(null)
  }

  function removeLocation(placeId: string) {
    onChange(value.filter((location) => location.placeId !== placeId))
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = suggestions[highlightedIndex]
      if (selected) addLocation(selected)
      return
    }

    if (event.key === 'Escape') {
      setSuggestions([])
      return
    }
  }

  return (
    <div className="space-y-3">
      <LocationSearchInput
        value={query}
        onChange={setQuery}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        loading={loading}
        inputId={inputId}
      />

      <SuggestionDropdown
        suggestions={suggestions}
        highlightedIndex={highlightedIndex}
        onSelect={addLocation}
        visible={showDropdown}
        query={query}
        loading={loading}
      />

      {duplicateMessage ? (
        <p className="text-xs text-amber-700">{duplicateMessage}</p>
      ) : null}

      <SelectedLocationChips
        locations={value}
        onRemove={removeLocation}
        disabled={disabled}
      />
    </div>
  )
}
