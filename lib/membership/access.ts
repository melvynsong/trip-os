import type { MembershipTier } from '@/lib/membership/types'

export const PREMIUM_FIND_PLACE_TIERS: MembershipTier[] = ['friend', 'owner']

export function isOwnerTier(userTier: MembershipTier): boolean {
  return userTier === 'owner'
}

/**
 * Returns true if the given userTier is included in the allowedTiers list.
 *
 * Usage:
 *   hasAccess(tier, ['friend', 'owner'])  // true for paid tiers
 *   hasAccess(tier, ['owner'])            // true for owner only
 */
export function hasAccess(
  userTier: MembershipTier,
  allowedTiers: MembershipTier[]
): boolean {
  return allowedTiers.includes(userTier)
}
