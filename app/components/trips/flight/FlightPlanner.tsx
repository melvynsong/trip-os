'use client'

import { useMemo, useState } from 'react'
import Button from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'
import type { SavedTripFlight } from '@/lib/flights/trip'
import type { FlightDirection, FlightLookupResult } from '@/src/lib/flights/types'

type Props = {
  tripId: string
  tripTitle: string
  startDate: string
  endDate: string
  initialSavedFlights: SavedTripFlight[]
}

type LookupPayload = {
  cached?: boolean
  from?: 'trip_cache' | 'provider'
  flight?: FlightLookupResult
  error?: string
}

type SavePayload = {
  flight?: SavedTripFlight
  error?: string
}

type TimelinePayload = {
  insertedCount?: number
  skippedCount?: number
  error?: string
}

const DIRECTION_LABEL: Record<FlightDirection, string> = {
  outbound: 'Outbound',
  return: 'Return',
  unknown: 'Unknown',
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

function getDurationLabel(departureTime: string | null, arrivalTime: string | null): string | null {
  if (!departureTime || !arrivalTime) return null

  const departure = new Date(departureTime)
  const arrival = new Date(arrivalTime)

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return null
  }

  const diffMs = arrival.getTime() - departure.getTime()
  if (diffMs <= 0) {
    return null
  }

  const totalMinutes = Math.round(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function normalizeFlightNumberForInput(value: string): string {
  const compact = value.toUpperCase().replace(/\s+/g, '')
  const match = /^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/.exec(compact)
  if (!match) return value.toUpperCase().trim()
  return `${match[1]} ${match[2]}`
}

function formatSavedSummary(flight: SavedTripFlight) {
  return `${flight.normalizedFlightNumber} · ${flight.flightDate}`
}

function SavedFlightCard({
  flight,
  onAddToTimeline,
  onDelete,
  isActing,
  isDeleting,
}: {
  flight: SavedTripFlight
  onAddToTimeline: (direction: FlightDirection) => Promise<void>
  onDelete: (direction: FlightDirection) => Promise<void>
  isActing: boolean
  isDeleting: boolean
}) {
  const durationLabel = getDurationLabel(flight.departureTime, flight.arrivalTime)

  return (
    <Card className="space-y-4 rounded-[1.75rem] border-[var(--border-soft)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            {DIRECTION_LABEL[flight.direction]} saved
          </p>
          <h3 className="mt-2 font-serif text-2xl text-[var(--text-strong)]">{formatSavedSummary(flight)}</h3>
        </div>
        <span className="rounded-full bg-[var(--brand-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
          {flight.status || 'planned'}
        </span>
      </div>

      <div className="grid gap-3 text-sm text-[var(--text-subtle)] sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Departs</p>
          <p className="mt-1 font-medium text-[var(--text-strong)]">{formatDateTime(flight.departureTime)}</p>
          <p className="mt-1">{flight.departureAirportCode} · {flight.departureAirportName || 'Departure airport'}</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Arrives</p>
          <p className="mt-1 font-medium text-[var(--text-strong)]">{formatDateTime(flight.arrivalTime)}</p>
          <p className="mt-1">{flight.arrivalAirportCode} · {flight.arrivalAirportName || 'Arrival airport'}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-subtle)]">
        <span>{flight.airlineName || flight.airlineCode} {flight.flightNumber}</span>
        {flight.aircraftModel ? <span>• {flight.aircraftModel}</span> : null}
        {durationLabel ? <span>• Duration: {durationLabel}</span> : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          loading={isActing}
          onClick={() => onAddToTimeline(flight.direction)}
          className="rounded-full"
        >
          Add flight to itinerary
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={isDeleting}
          onClick={() => onDelete(flight.direction)}
          className="rounded-full text-red-600 hover:text-red-700"
        >
          Delete
        </Button>
      </div>
    </Card>
  )
}

export default function FlightPlanner({
  tripId,
  tripTitle,
  startDate,
  endDate,
  initialSavedFlights,
}: Props) {
  const [direction, setDirection] = useState<FlightDirection>('outbound')
  const [flightNumberInput, setFlightNumberInput] = useState('')
  const [flightDateInput, setFlightDateInput] = useState(startDate)
  const [lookupResult, setLookupResult] = useState<FlightLookupResult | null>(null)
  const [lookupSource, setLookupSource] = useState<'trip_cache' | 'provider' | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [actingDirection, setActingDirection] = useState<FlightDirection | null>(null)
  const [deletingDirection, setDeletingDirection] = useState<FlightDirection | null>(null)
  const [globalMessage, setGlobalMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const [savedFlights, setSavedFlights] = useState<Record<FlightDirection, SavedTripFlight | null>>({
    outbound: initialSavedFlights.find((flight) => flight.direction === 'outbound') || null,
    return: initialSavedFlights.find((flight) => flight.direction === 'return') || null,
    unknown: initialSavedFlights.find((flight) => flight.direction === 'unknown') || null,
  })

  const hasLookupInputs = Boolean(flightNumberInput.trim() && flightDateInput)

  const selectedSummary = useMemo(() => {
    if (!lookupResult) return null

    return `${lookupResult.normalizedFlightNumber} · ${lookupResult.departureAirportCode || '—'} → ${lookupResult.arrivalAirportCode || '—'}`
  }, [lookupResult])

  const lookupDurationLabel = useMemo(
    () => getDurationLabel(lookupResult?.departureTime || null, lookupResult?.arrivalTime || null),
    [lookupResult]
  )

  async function handleLookup() {
    if (!hasLookupInputs || isLookingUp) return

    setIsLookingUp(true)
    setLookupResult(null)
    setLookupSource(null)
    setGlobalMessage(null)

    try {
      const response = await fetch('/api/flights/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tripId,
          flightNumber: flightNumberInput,
          flightDate: flightDateInput,
        }),
      })

      const payload = (await response.json()) as LookupPayload

      if (!response.ok || !payload.flight) {
        throw new Error(payload.error || 'Flight lookup failed.')
      }

      setLookupResult(payload.flight)
      setLookupSource(payload.from || null)

      if (payload.cached) {
        setGlobalMessage({
          tone: 'success',
          text: 'Loaded saved flight details from your trip history.',
        })
      }
    } catch (error) {
      setGlobalMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Flight lookup failed.',
      })
    } finally {
      setIsLookingUp(false)
    }
  }

  async function handleSaveSelection() {
    if (!lookupResult || isSaving) return

    setIsSaving(true)
    setGlobalMessage(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          direction,
          flight: lookupResult,
        }),
      })

      const payload = (await response.json()) as SavePayload

      if (!response.ok || !payload.flight) {
        throw new Error(payload.error || 'Failed to save selected flight.')
      }

      setSavedFlights((prev) => ({ ...prev, [direction]: payload.flight || null }))
      setGlobalMessage({
        tone: 'success',
        text: `${DIRECTION_LABEL[direction]} flight saved to ${tripTitle}.`,
      })
    } catch (error) {
      setGlobalMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to save selected flight.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddToTimeline(targetDirection: FlightDirection) {
    if (actingDirection) return

    setActingDirection(targetDirection)
    setGlobalMessage(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/flight/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ direction: targetDirection }),
      })

      const payload = (await response.json()) as TimelinePayload
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add flight to itinerary.')
      }

      const insertedCount = payload.insertedCount ?? 0
      const skippedCount = payload.skippedCount ?? 0
      const skippedText = skippedCount > 0 ? ` ${skippedCount} item${skippedCount === 1 ? ' was' : 's were'} already there.` : ''

      setGlobalMessage({
        tone: 'success',
        text: `Added ${insertedCount} flight timeline item${insertedCount === 1 ? '' : 's'}.${skippedText}`,
      })
    } catch (error) {
      setGlobalMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to add flight to itinerary.',
      })
    } finally {
      setActingDirection(null)
    }
  }

  async function handleDeleteFlight(targetDirection: FlightDirection) {
    if (deletingDirection) return

    setDeletingDirection(targetDirection)
    setGlobalMessage(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ direction: targetDirection }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to delete flight.')
      }

      setSavedFlights((prev) => ({ ...prev, [targetDirection]: null }))
      setGlobalMessage({
        tone: 'success',
        text: `${DIRECTION_LABEL[targetDirection]} flight deleted.`,
      })
    } catch (error) {
      setGlobalMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete flight.',
      })
    } finally {
      setDeletingDirection(null)
    }
  }

  return (
    <div className="space-y-6">
      {globalMessage ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            globalMessage.tone === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {globalMessage.text}
        </div>
      ) : null}

      <Card className="space-y-5 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Add Flight <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
          </p>
          <h2 className="text-2xl font-serif text-[var(--text-strong)]">Flight lookup for {tripTitle}</h2>
          <p className="max-w-2xl text-sm leading-7 text-[var(--text-subtle)]">
            Enter the flight number and date, confirm the result, then save it to your trip.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] p-1">
          {(['outbound', 'return', 'unknown'] as FlightDirection[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setDirection(value)
                if (value === 'return') setFlightDateInput((prev) => prev || endDate)
                if (value === 'outbound') setFlightDateInput((prev) => prev || startDate)
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                direction === value
                  ? 'bg-white text-[var(--text-strong)] shadow-sm'
                  : 'text-[var(--text-subtle)] hover:text-[var(--text-strong)]'
              }`}
            >
              {DIRECTION_LABEL[value]}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-strong)]">Flight number</label>
            <input
              type="text"
              value={flightNumberInput}
              onChange={(event) => setFlightNumberInput(event.target.value.toUpperCase())}
              onBlur={() => setFlightNumberInput((value) => normalizeFlightNumberForInput(value))}
              placeholder="SQ895 or SQ 895"
              className="h-11 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)]"
            />
            <p className="text-xs text-[var(--text-subtle)]">We’ll normalize common formats automatically.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-strong)]">Flight date</label>
            <input
              type="date"
              value={flightDateInput}
              onChange={(event) => setFlightDateInput(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)]"
            />
            <p className="text-xs text-[var(--text-subtle)]">Use the operating date for the flight number.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            loading={isLookingUp}
            disabled={!hasLookupInputs}
            onClick={handleLookup}
            className="rounded-full"
          >
            Lookup flight
          </Button>
          {lookupResult ? (
            <Button
              type="button"
              variant="secondary"
              loading={isSaving}
              onClick={handleSaveSelection}
              className="rounded-full"
            >
              Save to trip
            </Button>
          ) : null}
        </div>
      </Card>

      {!lookupResult && !isLookingUp ? (
        <div className="rounded-[1.75rem] border border-dashed border-[var(--border-soft)] bg-white px-6 py-8 text-center text-sm text-[var(--text-subtle)]">
          Enter a flight number and date, then run lookup.
        </div>
      ) : null}

      {lookupResult ? (
        <Card className="space-y-4 rounded-[1.75rem] border-[var(--border-soft)] bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Lookup result</p>
            <h3 className="mt-2 font-serif text-2xl text-[var(--text-strong)]">{selectedSummary}</h3>
            <p className="mt-1 text-sm text-[var(--text-subtle)]">
              {lookupSource === 'trip_cache'
                ? 'Loaded from saved trip data to reduce API calls.'
                : 'Loaded from AeroDataBox provider data.'}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-[var(--text-subtle)] sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Departure</p>
              <p className="mt-1 font-medium text-[var(--text-strong)]">{formatDateTime(lookupResult.departureTime)}</p>
              <p className="mt-1">{lookupResult.departureAirportCode || '—'} · {lookupResult.departureAirportName || 'Unknown airport'}</p>
              {lookupResult.departureTerminal ? <p className="mt-1 text-xs">Terminal {lookupResult.departureTerminal}</p> : null}
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Arrival</p>
              <p className="mt-1 font-medium text-[var(--text-strong)]">{formatDateTime(lookupResult.arrivalTime)}</p>
              <p className="mt-1">{lookupResult.arrivalAirportCode || '—'} · {lookupResult.arrivalAirportName || 'Unknown airport'}</p>
              {lookupResult.arrivalTerminal ? <p className="mt-1 text-xs">Terminal {lookupResult.arrivalTerminal}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-subtle)]">
            <span>{lookupResult.airlineName || lookupResult.airlineCode || 'Unknown airline'} {lookupResult.flightNumber}</span>
            {lookupResult.status ? <span>• Status: {lookupResult.status}</span> : null}
            {lookupResult.aircraftModel ? <span>• {lookupResult.aircraftModel}</span> : null}
            {lookupDurationLabel ? <span>• Duration: {lookupDurationLabel}</span> : null}
          </div>

          <Button type="button" variant="primary" loading={isSaving} onClick={handleSaveSelection} className="rounded-full">
            Save {DIRECTION_LABEL[direction].toLowerCase()} flight
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {savedFlights.outbound ? (
          <SavedFlightCard
            flight={savedFlights.outbound}
            onAddToTimeline={handleAddToTimeline}
            onDelete={handleDeleteFlight}
            isActing={actingDirection === 'outbound'}
            isDeleting={deletingDirection === 'outbound'}
          />
        ) : null}
        {savedFlights.return ? (
          <SavedFlightCard
            flight={savedFlights.return}
            onAddToTimeline={handleAddToTimeline}
            onDelete={handleDeleteFlight}
            isActing={actingDirection === 'return'}
            isDeleting={deletingDirection === 'return'}
          />
        ) : null}
        {savedFlights.unknown ? (
          <SavedFlightCard
            flight={savedFlights.unknown}
            onAddToTimeline={handleAddToTimeline}
            onDelete={handleDeleteFlight}
            isActing={actingDirection === 'unknown'}
            isDeleting={deletingDirection === 'unknown'}
          />
        ) : null}
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-subtle)]">
        This is a planning companion only. It helps you keep your known flight details with your trip and add compact departure/arrival moments to the itinerary. It does not book tickets or process payment.
      </div>
    </div>
  )
}
