import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserEntitlements } from '@/lib/membership/server'
import { hasAccess } from '@/lib/membership/access'
import type { MembershipTier } from '@/lib/membership/types'
import AddPlaceDrawer from '@/app/components/places/picker/AddPlaceDrawer'
import FeatureComingSoon from '@/app/components/FeatureComingSoon'
import { type PlaceType } from '@/lib/places'

type Props = {
  params: Promise<{ tripId: string }>
  searchParams?: Promise<{ placeType?: string }>
}

// ---------------------------------------------------------------------------
// Tiers that have access to the premium Find Places feature
// ---------------------------------------------------------------------------
const PREMIUM_FIND_PLACE_TIERS: MembershipTier[] = ['friend', 'owner']

// ---------------------------------------------------------------------------
// Feature copy — edit all card text here
// ---------------------------------------------------------------------------
const COPY = {
  title: 'Google Search & Maps',
  premiumDescription:
    'Search places, explore maps, and discover top-rated food and attractions seamlessly within your trip.',
  freeDescription:
    'Unlock smarter place discovery with maps, ratings, and better recommendations.',
  ctaText: 'Upgrade to Friend',
} as const

function parsePlaceType(value: string | undefined): PlaceType | undefined {
  if (!value) return undefined

  if (
    value === 'attraction' ||
    value === 'restaurant' ||
    value === 'shopping' ||
    value === 'cafe' ||
    value === 'hotel' ||
    value === 'other'
  ) {
    return value
  }

  return undefined
}

export default async function NewPlacePage({ params, searchParams }: Props) {
  const { tripId } = await params
  const parsedSearch = searchParams ? await searchParams : undefined

  // Reuse existing entitlement flow — handles auth + tier resolution
  let tier: MembershipTier
  try {
    const entitlements = await getCurrentUserEntitlements()
    tier = entitlements.tier
  } catch {
    redirect('/')
  }

  const supabase = await createClient()
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, title, destination')
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    notFound()
  }

  const isPremiumUser = hasAccess(tier, PREMIUM_FIND_PLACE_TIERS)

  return (
    <main>
      {isPremiumUser ? (
        /*
         * PREMIUM USERS (friend / owner)
         * Show only the premium placeholder.
         *
         * ── STEP 2 integration point ──────────────────────────────────────
         * Replace <FeatureComingSoon> with <GoogleMapsSearch> here.
         * Keep the isPremiumUser gate above; just swap the component.
         * ──────────────────────────────────────────────────────────────────
         */
        <div className="mx-auto max-w-xl p-6">
          <FeatureComingSoon
            title={COPY.title}
            description={COPY.premiumDescription}
            userTier={tier}
            allowedTiers={PREMIUM_FIND_PLACE_TIERS}
          />
        </div>
      ) : (
        /*
         * FREE USERS
         * Show the existing Find Place feature, then the upsell card below.
         */
        <>
          <AddPlaceDrawer
            tripId={tripId}
            tripTitle={trip.title}
            destination={trip.destination}
            initialPlaceType={parsePlaceType(parsedSearch?.placeType)}
          />
          <div className="mx-auto max-w-xl px-6 pb-8">
            <FeatureComingSoon
              title={COPY.title}
              description={COPY.freeDescription}
              userTier={tier}
              allowedTiers={PREMIUM_FIND_PLACE_TIERS}
              ctaText={COPY.ctaText}
            />
          </div>
        </>
      )}
    </main>
  )
}
