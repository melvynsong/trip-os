'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FlightRouteMap from '@/app/components/trips/flight/FlightRouteMap'
import BetaBadge from '@/app/components/ui/BetaBadge'
import Button from '@/app/components/ui/Button'
import SegmentedControl from '@/app/components/ui/SegmentedControl'
import type { FlightActivity } from '@/lib/trips/flight-activity'
import type { FlightLookupResult, FlightDirection } from '@/src/lib/flights/types'

// ─── types ────────────────────────────────────────────────────────────────────

type ActivityFlightInputProps = {
  tripId: string
  /** ISO date string for this day, e.g. "2026-03-28". Lookup is locked to this date. */
  flightDate: string
  onFlightSelected?: (flight: FlightActivity | null) => void
  canUseFlights?: boolean
  accessMessage?: string | null
}

type FlightsPayload = {
  flights?: FlightActivity[]
  error?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalizeFlightNumber(value: string): string {
  const compact = value.toUpperCase().replace(/\s+/g, '')
  const match = /^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/.exec(compact)
  if (!match) return value.toUpperCase().trim()
  return `${match[1]} ${match[2]}`
}

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

function formatTime(dateTime: string | null): string {
  if (!dateTime) return '—'
  const match = /[T\s](\d{2}):(\d{2})/.exec(dateTime)
  if (!match) return '—'
  const hour24 = Number(match[1])
  const minute = match[2]
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minute} ${ampm}`
}

function getDuration(dep: string | null, arr: string | null): string | null {
  if (!dep || !arr) return null
  const d = new Date(dep)
  const a = new Date(arr)
  if (Number.isNaN(d.getTime()) || Number.isNaN(a.getTime())) return null
  const diffMs = a.getTime() - d.getTime()
  if (diffMs <= 0) return null
  const mins = Math.round(diffMs / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function directionLabel(dir: FlightDirection): string {
  if (dir === 'outbound') return 'Outbound'
  if (dir === 'return') return 'Return'
  return 'Other'
}

// ─── departure / arrival leg card ─────────────────────────────────────────────

type LegCardProps = {
  label: string
  airportCode: string
  city: string | null
  airportName: string | null
  time: string | null
  terminal: string | null
}

function formatDateTime(dateTime: string | null): string {
  if (!dateTime) return '—'
  const d = new Date(dateTime)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function LegCard({ label, airportCode, city, airportName, time, terminal }: LegCardProps) {
  const formatted = formatDateTime(time);
  if (typeof window !== 'undefined') {
    // Log for troubleshooting date/time issues
    // eslint-disable-next-line no-console
    console.log('[LegCard] label:', label, 'raw:', time, 'formatted:', formatted);
  }
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold leading-none text-[var(--text-strong)]">
        {airportCode || '—'}
      </p>
      <p className="mt-0.5 text-xs text-[var(--text-subtle)]">
        {city || airportName || '—'}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--text-strong)]">{formatted}</p>
      {terminal ? (
        <p className="mt-0.5 text-[10px] text-[var(--text-subtle)]">Terminal {terminal}</p>
      ) : null}
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ActivityFlightInput({
  tripId,
  flightDate,
  onFlightSelected,
  canUseFlights = true,
  accessMessage,
}: ActivityFlightInputProps) {
  const [selectedDirection, setSelectedDirection] = useState<FlightDirection>('outbound')
  const router = useRouter()
  const [allFlights, setAllFlights] = useState<FlightActivity[]>([])
  const [isLoadingFlights, setIsLoadingFlights] = useState(false)

  const [flightNumberInput, setFlightNumberInput] = useState('')
  const [lookupResult, setLookupResult] = useState<FlightLookupResult | null>(null)

  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const flightOnThisDay = allFlights.find((f) => f.departure && f.departure.datetime && f.departure.datetime.startsWith(flightDate)) ?? null
  const showLookupForm = !flightOnThisDay || isReplacing
  const hasFlightNumber = flightNumberInput.trim().length > 0
  const lookupDuration = getDuration(lookupResult?.departureTime ?? null, lookupResult?.arrivalTime ?? null)
  const savedDuration = flightOnThisDay
    ? getDuration(flightOnThisDay.departure.datetime, flightOnThisDay.arrival.datetime)
    : null

  // Debug log for troubleshooting flight date issues
  if (typeof window !== 'undefined' && lookupResult) {
    // eslint-disable-next-line no-console
    console.log('[ActivityFlightInput][DEBUG] flightDate prop:', flightDate, 'lookupResult.departureTime:', lookupResult.departureTime, 'lookupResult.arrivalTime:', lookupResult.arrivalTime);
  }

  useEffect(() => {
    if (!canUseFlights) {
      setAllFlights([])
      return
    }

    let active = true
    void (async () => {
      setIsLoadingFlights(true)
      try {
        const resp = await fetch(`/api/trips/${tripId}/flight`, {
          method: 'GET',
          credentials: 'include',
        })
        const payload = (await resp.json()) as FlightsPayload
        if (!resp.ok) {
          if (active) setError(payload.error || 'Failed to load flights.')
          return
        }
        if (active) setAllFlights(payload.flights || [])
      } catch {
        if (active) setError('Failed to load flights.')
      } finally {
        if (active) setIsLoadingFlights(false)
      }
    })()

    return () => { active = false }
  }, [tripId, canUseFlights])

  async function handleLookup() {
    if (!hasFlightNumber || isLookingUp || !canUseFlights) return
    setError(null)
    setSuccessMessage(null)
    setLookupResult(null)
    setIsLookingUp(true)
    try {
      const resp = await fetch('/api/flights/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tripId, flightNumber: flightNumberInput.trim(), flightDate }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.error || 'Flight lookup failed.')
        return
      }
      setLookupResult(data.flight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setIsLookingUp(false)
    }
  }

  async function handleSaveToItinerary() {
    if (!lookupResult || isSaving || !canUseFlights) return
    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)
    try {
      // Map lookupResult to unified FlightActivity structure
      const flightActivity: FlightActivity = {
        id: '', // No id in lookupResult; will be set by backend or generated later
        day_id: '', // Will be set by backend
        type: 'flight',
        airline: lookupResult.airlineName || lookupResult.airlineCode || '',
        flightNumber: lookupResult.flightNumber,
        carrierCode: lookupResult.airlineCode || '',
        departure: {
          airportCode: lookupResult.departureAirportCode || '',
          airportName: lookupResult.departureAirportName || '',
          city: lookupResult.departureCity || '',
          terminal: lookupResult.departureTerminal || '',
          datetime: lookupResult.departureTime || '',
        },
        arrival: {
          airportCode: lookupResult.arrivalAirportCode || '',
          airportName: lookupResult.arrivalAirportName || '',
          city: lookupResult.arrivalCity || '',
          terminal: lookupResult.arrivalTerminal || '',
          datetime: lookupResult.arrivalTime || '',
        },
        duration: lookupDuration || undefined,
        aircraft: lookupResult.aircraftModel || undefined,
        notes: lookupResult.status || undefined,
        rawMetadata: lookupResult.rawResponseJson || undefined,
        created_at: new Date().toISOString(),
      };
      const saveResp = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flight: flightActivity }),
      })
      const saveData = await saveResp.json()
      if (!saveResp.ok) {
        setError(saveData.error || 'Failed to save flight.')
        return
      }
      const savedFlight = saveData.flight as FlightActivity
      setAllFlights([savedFlight])
      setLookupResult(null)
      setFlightNumberInput('')
      setIsReplacing(false)
      setSuccessMessage('Flight saved! The journey has been added to your itinerary.')
      onFlightSelected?.(savedFlight)
      setTimeout(() => {
        router.push(`/trips/${tripId}/itinerary`)
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flight.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(flight: FlightActivity) {
    if (!confirm(`Remove flight ${flight.flightNumber} from your trip?`)) return
    setError(null)
    setIsDeleting(true)
    try {
      const resp = await fetch(`/api/trips/${tripId}/flight`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: flight.id }),
      })
      if (!resp.ok) {
        const d = await resp.json()
        setError(d.error || 'Failed to delete flight.')
        return
      }
      setAllFlights([])
      onFlightSelected?.(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flight.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoadingFlights) {
    return (
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-4">
        <p className="text-sm text-[var(--text-subtle)]">Loading flight info...</p>
      </div>
    )
  }

  // Use the actual departure date from lookupResult if available, else fallback to flightDate prop
  let displayDate = flightDate;
  if (lookupResult && lookupResult.departureTime) {
    // Extract YYYY-MM-DD from ISO string
    const match = lookupResult.departureTime.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) displayDate = match[1];
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border-soft)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-[var(--text-strong)]">Flight</h4>
          <BetaBadge />
        </div>
        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-subtle)]">
          ✈️ {formatDate(displayDate)}
        </span>
      </div>

      {!canUseFlights ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {accessMessage || 'Flight features are not available for this account yet.'}
        </div>
      ) : null}

      {flightOnThisDay && !isReplacing ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                Flight
              </p>
              <p className="text-base font-semibold text-[var(--text-strong)]">
                {flightOnThisDay.flightNumber}
                {flightOnThisDay.airline ? ` · ${flightOnThisDay.airline}` : ''}
              </p>
              {flightOnThisDay.aircraft ? (
                <p className="text-xs text-[var(--text-subtle)]">{flightOnThisDay.aircraft}</p>
              ) : null}
            </div>
            {savedDuration ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {savedDuration}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LegCard
              label="Departs"
              airportCode={flightOnThisDay.departure.airportCode}
              city={flightOnThisDay.departure.city}
              airportName={flightOnThisDay.departure.airportName}
              time={flightOnThisDay.departure.datetime}
              terminal={flightOnThisDay.departure.terminal ?? null}
            />
            <LegCard
              label="Arrives"
              airportCode={flightOnThisDay.arrival.airportCode}
              city={flightOnThisDay.arrival.city}
              airportName={flightOnThisDay.arrival.airportName}
              time={flightOnThisDay.arrival.datetime}
              terminal={flightOnThisDay.arrival.terminal ?? null}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsReplacing(true)
                setLookupResult(null)
                setFlightNumberInput('')
                setError(null)
                setSuccessMessage(null)
              }}
            >
              Replace flight
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={isDeleting}
              disabled={isDeleting}
              onClick={() => handleDelete(flightOnThisDay)}
            >
              Delete flight
            </Button>
          </div>
        </div>
      ) : null}

      {showLookupForm && canUseFlights ? (
        <div className="space-y-3">
          {isReplacing ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-strong)]">Replace flight</p>
              <button
                type="button"
                onClick={() => {
                  setIsReplacing(false)
                  setLookupResult(null)
                  setFlightNumberInput('')
                  setError(null)
                }}
                className="text-xs text-[var(--text-subtle)] hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-subtle)]">
              No flight on this day yet. Enter a flight number to look it up.
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-subtle)]">
              Flight Number
            </label>
            <input
              type="text"
              value={flightNumberInput}
              onChange={(e) => {
                setFlightNumberInput(normalizeFlightNumber(e.target.value))
                setLookupResult(null)
              }}
              placeholder="e.g. SQ 874"
              className="h-10 w-full rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)]"
            />
          </div>

          <SegmentedControl
            value={selectedDirection}
            onChange={setSelectedDirection}
            options={[
              { label: 'Outbound', value: 'outbound' },
              { label: 'Return', value: 'return' },
              { label: 'Other', value: 'unknown' },
            ]}
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isLookingUp}
            disabled={!hasFlightNumber || isLookingUp}
            onClick={handleLookup}
          >
            Search flight
          </Button>

          {lookupResult ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <LegCard
                  label="Departs"
                  airportCode={lookupResult.departureAirportCode || '—'}
                  city={lookupResult.departureCity}
                  airportName={lookupResult.departureAirportName}
                  time={lookupResult.departureTime}
                  terminal={lookupResult.departureTerminal}
                />
                <LegCard
                  label="Arrives"
                  airportCode={lookupResult.arrivalAirportCode || '—'}
                  city={lookupResult.arrivalCity}
                  airportName={lookupResult.arrivalAirportName}
                  time={lookupResult.arrivalTime}
                  terminal={lookupResult.arrivalTerminal}
                />
              </div>

              {lookupDuration || lookupResult.airlineName || lookupResult.aircraftModel ? (
                <p className="text-xs text-[var(--text-subtle)]">
                  {[
                    lookupResult.airlineName || lookupResult.airlineCode,
                    lookupResult.aircraftModel,
                    lookupDuration,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}

              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={isSaving}
                disabled={isSaving}
                onClick={handleSaveToItinerary}
              >
                Save to Itinerary
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {allFlights.length >= 2 ? <FlightRouteMap flights={allFlights} /> : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {successMessage ? <p className="text-xs text-emerald-700">{successMessage}</p> : null}
    </div>
  )
}
