import { createClient } from '@/lib/supabase/server'
import type { EntitlementSnapshot, MembershipTier } from '@/lib/membership/types'

type MemberRow = {
  id: string
  email: string
  tier: MembershipTier
  is_active: boolean
}

export type CurrentUserMembership = {
  userId: string
  email: string
  tier: MembershipTier
  isActive: boolean
  isGmailAllowed: boolean
}

function getTripLimitPerYear(tier: MembershipTier): number | null {
  if (tier === 'owner') return null
  if (tier === 'friend') return 3
  return 1
}

// All users can delete trips — no tier restriction.
function canDeleteTrip(): boolean {
  return true
}

function getUtcYearBounds(now = new Date()) {
  const year = now.getUTCFullYear()
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).toISOString()
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)).toISOString()
  return { start, end }
}

export async function getCurrentUserMembership(): Promise<CurrentUserMembership> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized.')
  }

  const authEmail = (user.email || '').trim().toLowerCase()
  const isGmailAllowed = authEmail.endsWith('@gmail.com')

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, email, tier, is_active')
    .eq('id', user.id)
    .maybeSingle<MemberRow>()

  if (memberError) {
    throw new Error(`Failed to load membership: ${memberError.message}`)
  }

  let resolvedMember = member

  if (!resolvedMember) {
    if (!isGmailAllowed) {
      throw new Error('Only gmail.com accounts are currently allowed to use this app.')
    }

    const autoTier: MembershipTier =
      authEmail === 'song.kg@gmail.com' ? 'owner' : 'free'

    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        id: user.id,
        email: authEmail,
        tier: autoTier,
        is_active: true,
      })
      .select('id, email, tier, is_active')
      .single<MemberRow>()

    if (insertError || !newMember) {
      throw new Error(`Failed to create membership: ${insertError?.message ?? 'unknown error'}`)
    }

    resolvedMember = newMember
  }

  if (!resolvedMember.is_active) {
    throw new Error('Your account has been deactivated. Please contact support.')
  }

  return {
    userId: user.id,
    email: authEmail,
    tier: resolvedMember.tier,
    isActive: resolvedMember.is_active,
    isGmailAllowed,
  }
}

export async function getCurrentUserEntitlements(): Promise<EntitlementSnapshot> {
  const supabase = await createClient()
  const membership = await getCurrentUserMembership()

  const { start, end } = getUtcYearBounds()

  const { count: currentYearTripCount, error: tripsError } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', membership.userId)
    .gte('created_at', start)
    .lt('created_at', end)

  if (tripsError) {
    throw new Error(`Failed to count current year trips: ${tripsError.message}`)
  }

  const tier = membership.tier
  const tripLimitPerYear = getTripLimitPerYear(tier)
  // AI features are unlimited for all users
  const itineraryAiLimit: number | null = null
  const itineraryAiUsed = 0

  const safeTripCount = currentYearTripCount || 0
  const remainingTripsThisYear =
    tripLimitPerYear === null ? null : Math.max(tripLimitPerYear - safeTripCount, 0)

  return {
    tier,
    canDeleteTrip: canDeleteTrip(),
    tripLimitPerYear,
    currentYearTripCount: safeTripCount,
    remainingTripsThisYear,
    itineraryAiLimit,
    itineraryAiUsed,
    itineraryAiRemaining: null,
    canUseItineraryAi: true,
    isGmailAllowed: membership.isGmailAllowed,
  }
}

