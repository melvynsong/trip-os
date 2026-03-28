import { getFlightAccessState } from '@/lib/feature-toggles'
import { getCurrentUserMembership } from '@/lib/membership/server'
import type { MembershipTier } from '@/lib/membership/types'

export type CurrentFlightAccessState = {
  tier: MembershipTier
  hasRequiredTier: boolean
  isEnabledByAdmin: boolean
  canAccess: boolean
}

export async function getCurrentUserFlightAccessState(): Promise<CurrentFlightAccessState> {
  const membership = await getCurrentUserMembership()
  const access = await getFlightAccessState(membership.tier)

  return {
    tier: membership.tier,
    ...access,
  }
}

export function getFlightAccessMessage(input: {
  hasRequiredTier: boolean
  isEnabledByAdmin: boolean
}): string {
  if (!input.hasRequiredTier) {
    return 'Flight (Beta) is available for Friends and Owner members.'
  }

  if (!input.isEnabledByAdmin) {
    return 'Flight (Beta) is currently disabled by the admin toggle.'
  }

  return 'Flight (Beta) is unavailable right now.'
}
