'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/app/components/ui/Button'
import SectionContainer from '@/app/components/ui/SectionContainer'
import { FormField } from '@/app/components/ui/FormField'

export default function NewTripPage() {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
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
      if (!destination.trim()) {
        throw new Error('Destination is required')
      }
      if (!startDate) {
        throw new Error('Start date is required')
      }
      if (!endDate) {
        throw new Error('End date is required')
      }
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date must be before end date')
      }

      const response = await fetch('/api/trips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          destination: destination.trim(),
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            type="text"
            id="title"
            label="Trip title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Paris Spring Adventure"
            disabled={loading}
          />

          <FormField
            type="text"
            id="destination"
            label="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Paris, France"
            disabled={loading}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              type="date"
              id="startDate"
              label="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
            <FormField
              type="date"
              id="endDate"
              label="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>

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
