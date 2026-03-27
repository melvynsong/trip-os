'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/app/components/ui/Button'
import SectionContainer from '@/app/components/ui/SectionContainer'
import { FormField } from '@/app/components/ui/FormField'
import TripDateRangePicker from '@/app/components/trips/new-trip/TripDateRangePicker'
import LocationSelector from '@/app/components/trips/new-trip/LocationSelector'
import { isEndDateAfterStartDate } from '@/lib/trips/date'
import { clusterLocationsByCountry } from '@/lib/trips/location-clustering'
import { buildPrimaryDestination, formatTripLocationLabel, type TripLocation } from '@/lib/trips/locations'

export default function NewTripPage() {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [destinations, setDestinations] = useState<TripLocation[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validation
      if (!title.trim()) {
        throw new Error('Trip title is required')
      }
      if (destinations.length === 0) {
        throw new Error('Add at least one destination')
      }
      if (!startDate) {
        throw new Error('Start date is required')
      }
      if (!endDate) {
        throw new Error('End date is required')
      }
      if (!isEndDateAfterStartDate(startDate, endDate)) {
        throw new Error('End date must be after start date')
      }

      const primaryDestination = buildPrimaryDestination(destinations)

      const response = await fetch('/api/trips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          destination: primaryDestination,
          destinations,
          start_date: startDate,
          end_date: endDate,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create trip')
      }

      // Success! Redirect to trips page
      router.push('/trips')
    } catch (err) {
      // Log the full error for debugging
      console.error('Error creating trip:', err)

      // Handle different error types
      let errorMessage = 'Something went wrong'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase error objects
        const supabaseError = err as {
          message?: string
          error?: {
            message?: string
          }
        }
        if (supabaseError.message) {
          errorMessage = supabaseError.message
        } else if (supabaseError.error?.message) {
          errorMessage = supabaseError.error.message
        } else {
          // Show the full error object as string for debugging
          errorMessage = `Database error: ${JSON.stringify(supabaseError)}`
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const locationClusters = clusterLocationsByCountry(destinations)

  return (
    <main className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-2xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <SectionContainer className="w-full">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            New trip
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[var(--text-strong)]">Create a new trip</h1>
          <p className="mt-2 text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
            Start with the essentials. You can shape the story after.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            type="text"
            id="title"
            label="Trip title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Paris Spring Adventure"
            disabled={loading}
          />

          <LocationSelector value={destinations} onChange={setDestinations} disabled={loading} />

          {locationClusters.length > 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
                Itinerary clusters
              </p>
              <div className="mt-3 space-y-2">
                {locationClusters.map((cluster) => (
                  <div key={cluster.clusterName} className="rounded-lg border border-[var(--border-soft)] bg-white p-3">
                    <p className="text-sm font-medium text-[var(--text-strong)]">{cluster.clusterName}</p>
                    <p className="mt-1 text-xs text-[var(--text-subtle)]">
                      {cluster.locations.map((location) => formatTripLocationLabel(location)).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <TripDateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            disabled={loading}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/trips" className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
              Cancel
            </Link>
            <Button type="submit" variant="primary" loading={loading} className="w-full rounded-full sm:w-auto">
              {loading ? 'Creating trip...' : 'Create trip'}
            </Button>
          </div>
        </form>
      </SectionContainer>
    </main>
  )
}
