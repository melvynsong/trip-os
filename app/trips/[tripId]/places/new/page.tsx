import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Trip as TripType } from '@/types/trip'

type Props = {
  params: Promise<{ tripId: string }>
}

type Trip = Pick<TripType, 'id' | 'title'>

export default async function NewPlacePage({ params }: Props) {
  const { tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title')
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    notFound()
  }

  async function createPlace(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const name = String(formData.get('name') || '').trim()
    const category = String(formData.get('category') || 'other').trim()
    const address = String(formData.get('address') || '').trim()
    const notes = String(formData.get('notes') || '').trim()

    if (!name) {
      throw new Error('Place name is required')
    }

    const { error } = await supabase.from('places').insert({
      trip_id: tripId,
      name,
      category,
      address: address || null,
      notes: notes || null,
    })

    if (error) {
      throw new Error(error.message)
    }

    redirect(`/trips/${tripId}/places`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Save a Place</h1>
        <p className="text-sm text-gray-500">{trip.title}</p>
      </div>

      <form action={createPlace} className="space-y-4 rounded-2xl border p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Place Name</label>
          <input
            name="name"
            required
            className="w-full rounded-xl border px-3 py-2"
            placeholder="e.g. Tao Tao Ju Restaurant"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            name="category"
            defaultValue="other"
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="food">Food</option>
            <option value="attraction">Attraction</option>
            <option value="shopping">Shopping</option>
            <option value="hotel">Hotel</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <input
            name="address"
            type="text"
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Optional address"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={4}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Optional notes (hours, menu, etc.)"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Save Place
          </button>

          <Link
            href={`/trips/${tripId}/places`}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
