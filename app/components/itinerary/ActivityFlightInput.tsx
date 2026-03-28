'use client'

import { useState } from 'react'
import Button from '@/app/components/ui/Button'
import type { FlightDirection, FlightLookupResult } from '@/src/lib/flights/types'
import type { SavedTripFlight } from '@/lib/flights/trip'

type ActivityFlightInputProps = {
  tripId: string
  flightDate: string
  onFlightSelected?: (flight: SavedTripFlight | null) => void
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

export default function ActivityFlightInput({
  tripId,
  flightDate,
  onFlightSelected,
}: ActivityFlightInputProps) {
  const [flightNumberInput, setFlightNumberInput] = useState('')
  const [lookupResult, setLookupResult] = useState<FlightLookupResult | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [selectedDirection, setSelectedDirection] = useState<FlightDirection>('outbound')
  const [error, setError] = useState<string | null>(null)

  const hasLookupInputs = Boolean(flightNumberInput.trim() && flightDate)

  async function handleLookup() {
    if (!hasLookupInputs) return

    setError(null)
    setIsLookingUp(true)
    setLookupResult(null)

    try {
      const response = await fetch('/api/flights/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
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
    if (!lookupResult) return

    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          flightNumber: lookupResult.flightNumber,
          normalizedFlightNumber: lookupResult.normalizedFlightNumber,
          flightDate: lookupResult.flightDate,
          direction: selectedDirection,
          departureTime: lookupResult.departureTime,
          arrivalTime: lookupResult.arrivalTime,
          departureAirportCode: lookupResult.departureAirportCode,
          departureAirportName: lookupResult.departureAirportName,
          arrivalAirportCode: lookupResult.arrivalAirportCode,
          arrivalAirportName: lookupResult.arrivalAirportName,
          airlineCode: lookupResult.airlineCode,
          airlineName: lookupResult.airlineName,
          aircraftModel: lookupResult.aircraftModel,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save flight')
        return
      }

      const data = await response.json()
      setLookupResult(null)
      setFlightNumberInput('')
      if (onFlightSelected && data.flight) {
        onFlightSelected(data.flight)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flight')
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-medium text-slate-900">Add Flight (optional)</h4>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Flight Number</label>
          <input
            type="text"
            value={flightNumberInput}
            onChange={(e) => setFlightNumberInput(normalizeFlightNumberForInput(e.target.value))}
            placeholder="e.g. SQ 874"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {flightDate && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isLookingUp}
            disabled={!hasLookupInputs || isLookingUp}
            onClick={handleLookup}
            className="w-full"
          >
            Lookup Flight
          </Button>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {lookupResult && (
          <div className="space-y-3 rounded-lg bg-white p-3">
            <div className="space-y-2 text-sm">
              <div className="font-medium text-slate-900">{lookupResult.normalizedFlightNumber}</div>
              <div className="text-slate-600">
                {formatDateTime(lookupResult.departureTime)} ({lookupResult.departureAirportCode}) →{' '}
                {formatDateTime(lookupResult.arrivalTime)} ({lookupResult.arrivalAirportCode})
              </div>
              <div className="text-xs text-slate-500">
                {lookupResult.airlineName || lookupResult.airlineCode} •{' '}
                {lookupResult.aircraftModel || 'Aircraft'}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Direction</label>
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value as FlightDirection)}
                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="outbound">Outbound</option>
                <option value="return">Return</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveFlight}
              className="w-full"
            >
              Save Flight to Trip
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
