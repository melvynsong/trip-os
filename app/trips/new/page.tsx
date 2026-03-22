'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
        const supabaseError = err as any
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
    <main className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">Create New Trip</h1>
        <p className="mb-8 text-center text-gray-600">
          Plan your next adventure
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Trip Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Paris Spring Adventure"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="mb-1 block text-sm font-medium">
              Destination
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Paris, France"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Trip...' : 'Create Trip'}
          </button>
        </form>

        {/* Cancel Link */}
        <div className="mt-4 text-center">
          <Link href="/trips" className="text-blue-600 hover:underline text-sm">
            Cancel
          </Link>
        </div>
      </div>
    </main>
  )
}
