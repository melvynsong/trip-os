export type MembershipTier = 'free' | 'friend' | 'owner'

export type EntitlementSnapshot = {
  tier: MembershipTier
  canDeleteTrip: boolean
  tripLimitPerYear: number | null
  currentYearTripCount: number
  remainingTripsThisYear: number | null
  itineraryAiLimit: number | null
  itineraryAiUsed: number
  itineraryAiRemaining: number | null
  canUseItineraryAi: boolean
  isGmailAllowed: boolean
}
