'use client'

import { useState } from 'react'
import Button from '@/app/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import type { SavedTripFlight } from '@/lib/flights/trip'
import type { FlightDirection, FlightLookupResult } from '@/src/lib/flights/types'

type ActivityFlightInputProps = {
  tripId: string
  flightDate: string
  onFlightSelected?: (flight: SavedTripFlight | null) => void
  canUseFlights?: boolean
  accessMessage?: string | null
  className?: string
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

function formatForInputDate(dateTime: string | null, fallback: string) {
  if (!dateTime) return fallback
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(dateTime)
  return match ? match[1] : fallback
}

function formatForInputTime(dateTime: string | null) {
  if (!dateTime) return ''
  const match = /(?:T|\s)(\d{2}:\d{2})/.exec(dateTime)
  return match ? match[1] : ''
}

function combineDateAndTime(date: string, time: string) {
  return date && time ? `${date}T${time}:00` : null
}

function extractAirportCode(value: string) {
  const match = value.toUpperCase().match(/\b([A-Z]{3})\b/)
  return match?.[1] ?? null
}

function extractAirlineCode(value: string) {
  const exact = value.trim().toUpperCase()
  if (/^[A-Z]{2,3}$/.test(exact)) return exact
  const paren = exact.match(/\(([A-Z]{2,3})\)/)
  if (paren) return paren[1]
  return null
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
  className,
}: ActivityFlightInputProps) {
  const [airline, setAirline] = useState('')
  const [flightNumberInput, setFlightNumberInput] = useState('')
  const [departureLocation, setDepartureLocation] = useState('')
  const [arrivalLocation, setArrivalLocation] = useState('')
  const [departureDate, setDepartureDate] = useState(flightDate)
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalDate, setArrivalDate] = useState(flightDate)
  const [arrivalTime, setArrivalTime] = useState('')
  const [terminal, setTerminal] = useState('')
  const [notes, setNotes] = useState('')
  const [lookupResult, setLookupResult] = useState<FlightLookupResult | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDirection, setSelectedDirection] = useState<FlightDirection>('outbound')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const airlineCode = extractAirlineCode(airline)
  const lookupFlightNumber = airlineCode && flightNumberInput.trim() ? `${airlineCode} ${flightNumberInput.trim()}` : ''
  const hasLookupInputs = Boolean(lookupFlightNumber && departureDate)
  const departureDateTime = combineDateAndTime(departureDate, departureTime)
  const arrivalDateTime = combineDateAndTime(arrivalDate, arrivalTime)
  const durationLabel = getDurationLabel(departureDateTime, arrivalDateTime)
  const canSave = Boolean(
    canUseFlights &&
      airline.trim() &&
      flightNumberInput.trim() &&
      departureLocation.trim() &&
      arrivalLocation.trim() &&
      departureDateTime &&
      arrivalDateTime
  )

  async function handleLookup() {
    if (!hasLookupInputs || !canUseFlights) return

    setError(null)
    setSuccessMessage(null)
    setIsLookingUp(true)
    setLookupResult(null)

    try {
      const response = await fetch('/api/flights/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          flightNumber: lookupFlightNumber,
          flightDate: departureDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Flight lookup failed')
        return
      }

      setLookupResult(data.flight)
      setAirline(data.flight.airlineCode || data.flight.airlineName || airline)
      setDepartureLocation(
        [data.flight.departureAirportCode, data.flight.departureAirportName || data.flight.departureCity]
          .filter(Boolean)
          .join(' · ')
      )
      setArrivalLocation(
        [data.flight.arrivalAirportCode, data.flight.arrivalAirportName || data.flight.arrivalCity]
          .filter(Boolean)
          .join(' · ')
      )
      setDepartureDate(formatForInputDate(data.flight.departureTime, departureDate))
      setDepartureTime(formatForInputTime(data.flight.departureTime))
      setArrivalDate(formatForInputDate(data.flight.arrivalTime, arrivalDate))
      setArrivalTime(formatForInputTime(data.flight.arrivalTime))
      setTerminal(data.flight.departureTerminal || data.flight.arrivalTerminal || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setIsLookingUp(false)
    }
  }

  async function handleSaveFlight() {
    if (!canSave || !canUseFlights) return

    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const normalizedFlightNumber = lookupFlightNumber || `${airline.trim()} ${flightNumberInput.trim()}`.trim()
      const flightPayload: FlightLookupResult = {
        normalizedFlightNumber,
        flightDate: departureDate,
        airlineName: airline.trim(),
        airlineCode,
        flightNumber: flightNumberInput.trim(),
        departureAirportCode: extractAirportCode(departureLocation),
        departureAirportName: departureLocation.trim(),
        departureCity: null,
        departureTime: departureDateTime,
        departureTerminal: terminal.trim() || null,
        arrivalAirportCode: extractAirportCode(arrivalLocation),
        arrivalAirportName: arrivalLocation.trim(),
        arrivalCity: null,
        arrivalTime: arrivalDateTime,
        arrivalTerminal: null,
        status: lookupResult?.status || 'Expected',
        aircraftModel: lookupResult?.aircraftModel || null,
        dataProvider: lookupResult ? lookupResult.dataProvider : 'manual',
        rawResponseJson: {
          ...(lookupResult?.rawResponseJson && typeof lookupResult.rawResponseJson === 'object'
            ? { provider: lookupResult.rawResponseJson }
            : {}),
          manualEntry: true,
          notes: notes.trim() || null,
        },
      }

      const response = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          direction: selectedDirection,
          flight: flightPayload,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save flight')
        return
      }

      setLookupResult(null)
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
    <div className={cn('space-y-4 rounded-2xl border border-[var(--border-soft)] bg-white p-4', className)}>
      <div className="space-y-1">
        <h4 className="font-medium text-[var(--text-strong)]">Add Flight</h4>
        <p className="text-sm text-[var(--text-subtle)]">
          Add flight details manually, or use an airline code + flight number to autofill the journey.
        </p>
      </div>

      {!canUseFlights ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {accessMessage || 'Flight is not available for this account yet.'}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Airline</label>
          <input
            type="text"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            placeholder="e.g. Singapore Airlines or SQ"
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Flight Number</label>
          <input
            type="text"
            value={flightNumberInput}
            onChange={(e) => setFlightNumberInput(normalizeFlightNumberForInput(e.target.value).replace(/^[A-Z]{2,3}\s*/, ''))}
            placeholder="e.g. 874"
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Departure Airport / City</label>
          <input
            type="text"
            value={departureLocation}
            onChange={(e) => setDepartureLocation(e.target.value)}
            placeholder="e.g. SIN · Singapore Changi"
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Arrival Airport / City</label>
          <input
            type="text"
            value={arrivalLocation}
            onChange={(e) => setArrivalLocation(e.target.value)}
            placeholder="e.g. HKG · Hong Kong Chek Lap Kok"
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Departure Date</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              disabled={!canUseFlights}
              className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Departure Time</label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              disabled={!canUseFlights}
              className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Arrival Date</label>
            <input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              disabled={!canUseFlights}
              className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Arrival Time</label>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              disabled={!canUseFlights}
              className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Terminal (optional)</label>
          <input
            type="text"
            value={terminal}
            onChange={(e) => setTerminal(e.target.value)}
            placeholder="e.g. 3"
            disabled={!canUseFlights}
            className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
          />
        </div>
        <div>
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

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any context you’d like to remember for this journey."
          disabled={!canUseFlights}
          className="w-full rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:opacity-60"
        />
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
          Autofill from flight number
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={isSaving}
          disabled={!canSave || isSaving}
          onClick={handleSaveFlight}
        >
          Save Flight to Trip
        </Button>
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

      {durationLabel ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Estimated duration: <span className="font-medium">{durationLabel}</span>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {successMessage ? <p className="text-xs text-emerald-700">{successMessage}</p> : null}
    </div>
  )
}
