import type { MembershipTier } from '@/lib/membership/types'

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
