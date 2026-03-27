'use client'

import type { TripLocation } from '../../../../lib/trips/locations'
import { formatTripLocationLabel } from '../../../../lib/trips/locations'

type SelectedLocationChipsProps = {
  locations: TripLocation[]
  onRemove: (placeId: string) => void
  disabled?: boolean
}

export default function SelectedLocationChips({
  locations,
  onRemove,
  disabled,
}: SelectedLocationChipsProps) {
  if (locations.length === 0) {
    return (
      <p className="text-sm text-[var(--text-subtle)]">Add destinations to start planning your trip</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
      {locations.map((location) => (
        <span
          key={location.placeId}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-strong)]"
        >
          <span className="truncate">{formatTripLocationLabel(location)}</span>
          <button
            type="button"
            onClick={() => onRemove(location.placeId)}
            disabled={disabled}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-subtle)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
            aria-label={`Remove ${formatTripLocationLabel(location)}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
