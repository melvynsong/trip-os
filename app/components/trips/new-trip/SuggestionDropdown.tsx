'use client'

import type { TripLocation } from '../../../../lib/trips/locations'
import { formatTripLocationLabel } from '../../../../lib/trips/locations'

type SuggestionDropdownProps = {
  suggestions: TripLocation[]
  highlightedIndex: number
  onSelect: (location: TripLocation) => void
  visible: boolean
  query: string
  loading: boolean
}

export default function SuggestionDropdown({
  suggestions,
  highlightedIndex,
  onSelect,
  visible,
  query,
  loading,
}: SuggestionDropdownProps) {
  if (!visible) return null

  const showEmpty = !loading && query.trim().length >= 2 && suggestions.length === 0

  return (
    <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--border-soft)] bg-white shadow-[0_10px_25px_rgba(28,25,23,0.08)]">
      {suggestions.map((suggestion, index) => {
        const isHighlighted = highlightedIndex === index

        return (
          <button
            key={suggestion.placeId}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition ${
              isHighlighted
                ? 'bg-[var(--brand-primary-soft)] text-[var(--text-strong)]'
                : 'text-[var(--text-strong)] hover:bg-[var(--surface-muted)]'
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{formatTripLocationLabel(suggestion)}</span>
              <span className="block text-xs text-[var(--text-subtle)] capitalize">{suggestion.type}</span>
            </span>
          </button>
        )
      })}

      {showEmpty ? (
        <p className="px-4 py-3 text-sm text-[var(--text-subtle)]">
          No locations found. Try another search
        </p>
      ) : null}
    </div>
  )
}
