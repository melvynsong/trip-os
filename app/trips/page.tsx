import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserEntitlements, getCurrentUserMembership } from '@/lib/membership/server'
import TripCard from '@/app/components/trips/TripCard'
import EmptyState from '@/app/components/ui/EmptyState'
import { buttonClass } from '@/app/components/ui/Button'
import { getTierLabel, getUserDisplayName } from '@/lib/user-display'
import { Trip as TripType } from '@/types/trip'

type TripListItem = Pick<
  TripType,
  'id' | 'title' | 'destination' | 'start_date' | 'end_date' | 'cover_image'
>

type TripListItemWithoutCover = Omit<TripListItem, 'cover_image'>

async function loadTripsForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const attempt1 = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date, cover_image')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .returns<TripListItem[]>()

  if (!attempt1.error) {
    return { data: attempt1.data || [], error: null }
  }

  const attempt2 = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .returns<TripListItemWithoutCover[]>()

  if (!attempt2.error) {
    return {
      data: (attempt2.data || []).map((trip) => ({ ...trip, cover_image: null })),
      error: null,
    }
  }

  const attempt3 = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date, cover_image')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<TripListItem[]>()

  if (!attempt3.error) {
    return { data: attempt3.data || [], error: null }
  }

  const attempt4 = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<TripListItemWithoutCover[]>()

  if (!attempt4.error) {
    return {
      data: (attempt4.data || []).map((trip) => ({ ...trip, cover_image: null })),
      error: null,
    }
  }

  const noOrderFallback = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .eq('user_id', userId)
    .returns<TripListItemWithoutCover[]>()

  if (!noOrderFallback.error) {
    return {
      data: (noOrderFallback.data || []).map((trip) => ({ ...trip, cover_image: null })),
      error: null,
    }
  }

  return {
    data: null,
    error: noOrderFallback.error || attempt4.error || attempt3.error || attempt2.error || attempt1.error,
  }
}

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

  const membership = await getCurrentUserMembership()

  const { data: trips, error } = await loadTripsForUser(supabase, user.id)

  if (error) {
    return (
      <div className="p-6">
        Failed to load trips.
        <div className="mt-2 text-sm text-stone-600">{error.message}</div>
      </div>
    )
  }

  const tripIds = (trips || []).map((trip) => trip.id)
  const { data: days } = tripIds.length
    ? await supabase
        .from('days')
        .select('id, trip_id')
        .in('trip_id', tripIds)
    : { data: [] }

  const dayIds = (days || []).map((day) => day.id)
  const { data: activities } = dayIds.length
    ? await supabase
        .from('activities')
        .select('id, day_id')
        .in('day_id', dayIds)
    : { data: [] }

  const { data: stories } = tripIds.length
    ? await supabase
        .from('stories')
        .select('id, trip_id')
        .in('trip_id', tripIds)
    : { data: [] }

  const dayCountByTrip = new Map<string, number>()
  const tripIdByDayId = new Map<string, string>()

  for (const day of days || []) {
    tripIdByDayId.set(day.id, day.trip_id)
    dayCountByTrip.set(day.trip_id, (dayCountByTrip.get(day.trip_id) || 0) + 1)
  }

  const activityCountByTrip = new Map<string, number>()
  for (const activity of activities || []) {
    const tripId = tripIdByDayId.get(activity.day_id)
    if (!tripId) continue
    activityCountByTrip.set(tripId, (activityCountByTrip.get(tripId) || 0) + 1)
  }

  const storyCountByTrip = new Map<string, number>()
  for (const story of stories || []) {
    storyCountByTrip.set(story.trip_id, (storyCountByTrip.get(story.trip_id) || 0) + 1)
  }

  const displayName = getUserDisplayName(user)
  const tierLabel = getTierLabel(membership.tier)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {deleteBlockedMessage ? (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {deleteBlockedMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.09)] sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Your stories</p>
            <h1 className="font-serif text-4xl leading-tight text-slate-900 sm:text-5xl">
              Welcome back, {displayName}
            </h1>
            <p className="text-lg text-slate-700">Your next story starts here.</p>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              {tierLabel}
            </div>
          </div>

          <Link
            href="/trips/new"
            className={buttonClass({
              variant: 'primary',
              className: 'rounded-full',
            })}
          >
            Start a new story
          </Link>
        </div>
      </section>

      <section className="mt-8 space-y-5">
        <div>
          <h2 className="font-serif text-3xl text-slate-900">Your stories</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
            A warm view of the trips you’re shaping, revisiting, and turning into memories.
          </p>
        </div>

        {trips && trips.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{
                  ...trip,
                  dayCount: dayCountByTrip.get(trip.id) || 0,
                  momentCount: activityCountByTrip.get(trip.id) || 0,
                  storyCount: storyCountByTrip.get(trip.id) || 0,
                }}
                onDeleteTrip={deleteTripAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="You haven’t started a story yet."
            description="Every journey begins with a plan."
            action={
              <Link
                href="/trips/new"
                className={buttonClass({
                  variant: 'primary',
                  className: 'rounded-full',
                })}
              >
                Start your first story
              </Link>
            }
            className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          />
        )}
      </section>
    </main>
  )
}