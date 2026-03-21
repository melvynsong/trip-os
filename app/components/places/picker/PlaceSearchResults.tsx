'use client'

export type PlaceSuggestion = {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

type PlaceSearchResultsProps = {
  suggestions: PlaceSuggestion[]
  loading: boolean
  error: string | null
  minCharsMet: boolean
  hasQuery: boolean
  onSelect: (suggestion: PlaceSuggestion) => void
}

export default function PlaceSearchResults({
  suggestions,
  loading,
  error,
  minCharsMet,
  hasQuery,
  onSelect,
}: PlaceSearchResultsProps) {
  if (!hasQuery) {
    return null
  }

  if (!minCharsMet) {
    return (
      <div className="rounded-xl border border-dashed p-3 text-sm text-gray-400">
        Keep typing to search places.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed p-3 text-sm text-gray-500">
        Searching places…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-3 text-sm text-gray-500">
        No places found. Try a different keyword.
      </div>
    )
  }

  return (
    <ul className="max-h-72 overflow-auto rounded-xl border bg-white">
      {suggestions.map((suggestion) => (
        <li key={suggestion.placeId} className="border-b last:border-b-0">
          <button
            type="button"
            onClick={() => onSelect(suggestion)}
            className="w-full px-3 py-2 text-left hover:bg-gray-50"
          >
            <div className="text-sm font-medium">{suggestion.mainText}</div>
            <div className="text-xs text-gray-500">{suggestion.secondaryText || suggestion.description}</div>
          </button>
        </li>
      ))}
    </ul>
  )
}
