/**
 * Canonical entitlement system.
 *
 * Rule: everyone gets all features — only trip count differs per tier.
 *   free   → 1 trip / year
 *   friend → 3 trips / year
 *   owner  → unlimited
 */
import { createClient } from './supabase/server'
import { getAdminConfig } from './admin-config'
import { getCurrentUserMembership } from './membership/server'
import type { MembershipTier } from './membership/types'

export type Entitlements = {
  tier: MembershipTier
  /** Numeric limit or 'unlimited' for owner tier */
  tripLimit: number | 'unlimited'
  tripsUsedThisYear: number
  tripsRemainingThisYear: number | 'unlimited'
  canCreateTrip: boolean
  isOwner: boolean
}

export function getTripLimit(tier: MembershipTier): number | 'unlimited' {
  if (tier === 'owner') return 'unlimited'
  if (tier === 'friend') return 3
  return 1
}

export async function getConfiguredTripLimit(tier: MembershipTier): Promise<number | 'unlimited'> {
  if (tier === 'owner') return 'unlimited'

  const config = await getAdminConfig()
  const row = config.find((item) => item.tier === tier)

  if (!row || row.trip_limit === null) {
    return getTripLimit(tier)
  }

  return row.trip_limit
}

function getUtcYearBounds(now = new Date()) {
  const year = now.getUTCFullYear()
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).toISOString()
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)).toISOString()
  return { start, end }
}

export async function getCurrentUserEntitlements(): Promise<Entitlements> {
  const membership = await getCurrentUserMembership()
  const supabase = await createClient()
  const { start, end } = getUtcYearBounds()

  const { count, error } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', membership.userId)
    .gte('created_at', start)
    .lt('created_at', end)

  if (error) {
    throw new Error(`Failed to count trips: ${error.message}`)
  }

  const tripsUsed = count || 0
  const tripLimit = await getConfiguredTripLimit(membership.tier)
  const canCreateTrip = tripLimit === 'unlimited' || tripsUsed < tripLimit

  return {
    tier: membership.tier,
    tripLimit,
    tripsUsedThisYear: tripsUsed,
    tripsRemainingThisYear:
      tripLimit === 'unlimited' ? 'unlimited' : Math.max(tripLimit - tripsUsed, 0),
    canCreateTrip,
    isOwner: membership.tier === 'owner',
  }
}
