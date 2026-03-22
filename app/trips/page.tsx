import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserEntitlements } from '@/lib/membership/server'
import PageHeader from '@/app/components/shared/PageHeader'
import TripCard from '@/app/components/trips/TripCard'
import EmptyState from '@/app/components/ui/EmptyState'
import { buttonClass } from '@/app/components/ui/Button'
import BrandLine from '@/app/components/shared/BrandLine'
import { Trip as TripType } from '@/types/trip'

type TripListItem = Pick<TripType, 'id' | 'title' | 'destination' | 'start_date' | 'end_date'>

type TripsPageProps = {
  searchParams?: Promise<{ error?: string }>
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const supabase = await createClient()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const pageError = resolvedSearchParams?.error

  const deleteBlockedMessage =
    pageError === 'delete_not_allowed'
      ? 'Free tier cannot delete trips. Upgrade to Friend tier to enable trip deletion.'
      : pageError === 'gmail_not_allowed'
        ? 'Only gmail.com accounts are currently allowed to manage trips.'
        : null

  async function deleteTripAction(formData: FormData) {
    'use server'

    const tripId = String(formData.get('trip_id') || '').trim()
    if (!tripId) return

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/')
    }

    const entitlements = await getCurrentUserEntitlements()

    if (!entitlements.isGmailAllowed) {
      redirect('/trips?error=gmail_not_allowed')
    }

    if (!entitlements.canDeleteTrip) {
      redirect('/trips?error=delete_not_allowed')
    }

    const { data: ownedTrip } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .maybeSingle<{ id: string }>()

    if (!ownedTrip) return

    const { data: days } = await supabase
      .from('days')
      .select('id')
      .eq('trip_id', tripId)
      .returns<Array<{ id: string }>>()

    const dayIds = (days || []).map((day) => day.id)

    if (dayIds.length > 0) {
      await supabase.from('activities').delete().in('day_id', dayIds)
    }

    await supabase.from('days').delete().eq('trip_id', tripId)
    await supabase.from('places').delete().eq('trip_id', tripId)
    await supabase.from('trips').delete().eq('id', tripId).eq('user_id', user.id)

    revalidatePath('/trips')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .order('start_date', { ascending: true })
    .returns<TripListItem[]>()

  if (error) {
    return <div className="p-6">Failed to load trips.</div>
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      {deleteBlockedMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {deleteBlockedMessage}
        </div>
      ) : null}

      <PageHeader
        title="My Trips"
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span>Create and manage your travel plans.</span>
            <BrandLine className="text-gray-400" />
          </span>
        }
        actions={
          <Link
            href="/trips/new"
            className={buttonClass({ variant: 'primary' })}
          >
            + Create Trip
          </Link>
        }
      />

      {trips && trips.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDeleteTrip={deleteTripAction} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No trips yet"
          description="Plan your next escape by creating your first trip."
        />
      )}
    </main>
  )
}