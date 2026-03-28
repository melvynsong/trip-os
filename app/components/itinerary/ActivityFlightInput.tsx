'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/app/components/ui/Button'
import type { SavedTripFlight } from '@/lib/flights/trip'
import type { FlightDirection, FlightLookupResult } from '@/src/lib/flights/types'
import { buttonClass } from '@/app/components/ui/Button'

type ActivityFlightInputProps = {
  tripId: string
  flightDate: string
  onFlightSelected?: (flight: SavedTripFlight | null) => void
  canUseFlights?: boolean
  accessMessage?: string | null
}

function normalizeFlightNumberForInput(value: string): string {
  const compact = value.toUpperCase().replace(/\s+/g, '')
  const match = /^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/.exec(compact)
  if (!match) return value.toUpperCase().trim()
  return `${match[1]} ${match[2]}`
}

function formatDateTime(dateTime: string | null) {
  if (!dateTime) return '—'

  const match = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/.exec(dateTime)
  if (!match) return dateTime.replace('T', ' ')

  const [, year, month, day, hourRaw, minute] = match
  const hour24 = Number(hourRaw)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const ampm = hour24 >= 12 ? 'PM' : 'AM'

  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))

  return `${monthLabel} ${Number(day)}, ${hour12}:${minute} ${ampm}`
}

function getDurationLabel(departureDateTime: string | null, arrivalDateTime: string | null) {
  if (!departureDateTime || !arrivalDateTime) return null
  const departure = new Date(departureDateTime)
  const arrival = new Date(arrivalDateTime)

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return null
  }

  const diffMs = arrival.getTime() - departure.getTime()
  if (diffMs <= 0) return null

  const totalMinutes = Math.round(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export default function ActivityFlightInput({
  tripId,
  flightDate,
  onFlightSelected,
  canUseFlights = true,
  accessMessage,
}: ActivityFlightInputProps) {
  const [flightNumberInput, setFlightNumberInput] = useState('')
  const [lookupResult, setLookupResult] = useState<FlightLookupResult | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDirection, setSelectedDirection] = useState<FlightDirection>('outbound')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const hasLookupInputs = Boolean(flightNumberInput.trim() && flightDate)
  const durationLabel = getDurationLabel(lookupResult?.departureTime || null, lookupResult?.arrivalTime || null)

  async function handleLookup() {
    if (!hasLookupInputs || !canUseFlights || isLookingUp) return

    setError(null)
    setSuccessMessage(null)
    setIsLookingUp(true)

    try {
      const response = await fetch('/api/flights/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tripId,
          flightNumber: flightNumberInput.trim(),
          flightDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Flight lookup failed')
        return
      }

      setLookupResult(data.flight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setIsLookingUp(false)
    }
  }

  async function handleSaveFlight() {
    if (!lookupResult || !canUseFlights || isSaving) return

    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const response = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          direction: selectedDirection,
          flight: lookupResult,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save flight')
        return
      }

      setLookupResult(data.flight || lookupResult)
      setSuccessMessage('Flight added to your trip story.')
      if (onFlightSelected && data.flight) {
        onFlightSelected(data.flight)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flight')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border-soft)] bg-white p-4">
      <div className="space-y-1">
        <h4 className="font-medium text-[var(--text-strong)]">Add Flight Beta</h4>
        <p className="text-sm text-[var(--text-subtle)]">
          Use flight number + date lookup to attach a flight to your story.
        </p>
      </div>

      {!canUseFlights ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {accessMessage || 'Flight is not available for this account yet.'}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Flight Number</label>
          <input
            type="text"
            value={flightNumberInput}
            onChange={(e) => setFlightNumberInput(normalizeFlightNumberForInput(e.target.value))}
            placeholder="e.g. SQ 874"
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Journey Role</label>
          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value as FlightDirection)}
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          >
            <option value="outbound">Outbound</option>
            <option value="return">Return</option>
            <option value="unknown">Other / Not sure yet</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={isLookingUp}
          disabled={!hasLookupInputs || isLookingUp || !canUseFlights}
          onClick={handleLookup}
        >
          Lookup flight
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={isSaving}
          disabled={!lookupResult || isSaving || !canUseFlights}
          onClick={handleSaveFlight}
        >
          Save to trip
        </Button>
        <Link
          href={`/trips/${tripId}/flight`}
          className={buttonClass({
            size: 'sm',
            variant: 'ghost',
            className: 'rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface-muted)]',
          })}
        >
          Open full Add Flight Beta
        </Link>
      </div>

      {lookupResult ? (
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-subtle)]">
          <p className="font-medium text-[var(--text-strong)]">{lookupResult.normalizedFlightNumber}</p>
          <p className="mt-1">
            {formatDateTime(lookupResult.departureTime)} ({lookupResult.departureAirportCode || '—'}) → {formatDateTime(lookupResult.arrivalTime)} ({lookupResult.arrivalAirportCode || '—'})
          </p>
          <p className="mt-1 text-xs">
            {[lookupResult.airlineName || lookupResult.airlineCode, lookupResult.aircraftModel, durationLabel ? `Duration ${durationLabel}` : null]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
      ) : null}

      {lookupResult && durationLabel ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Duration: <span className="font-medium">{durationLabel}</span>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {successMessage ? <p className="text-xs text-emerald-700">{successMessage}</p> : null}
    </div>
  )
}
