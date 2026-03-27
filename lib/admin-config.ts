import { createClient } from './supabase/server'

export type FeatureFlags = {
  googlePlaces: boolean
  tripDeletion: boolean
  aiFeatures: boolean
}

export type TierLimitRow = {
  tier: 'free' | 'friend' | 'owner'
  trip_limit: number | null
  feature_flags: FeatureFlags
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  googlePlaces: true,
  tripDeletion: true,
  aiFeatures: true,
}

export const DEFAULT_ADMIN_CONFIG: TierLimitRow[] = [
  { tier: 'free', trip_limit: 1, feature_flags: DEFAULT_FEATURE_FLAGS },
  { tier: 'friend', trip_limit: 3, feature_flags: DEFAULT_FEATURE_FLAGS },
  { tier: 'owner', trip_limit: null, feature_flags: DEFAULT_FEATURE_FLAGS },
]

function normalizeFlags(value: unknown): FeatureFlags {
  const input = typeof value === 'object' && value ? (value as Partial<FeatureFlags>) : {}
  return {
    googlePlaces: input.googlePlaces ?? true,
    tripDeletion: input.tripDeletion ?? true,
    aiFeatures: input.aiFeatures ?? true,
  }
}

export async function getAdminConfig() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admin_config')
    .select('tier, trip_limit, feature_flags')
    .order('tier', { ascending: true })

  if (error) {
    return DEFAULT_ADMIN_CONFIG
  }

  const rows = (data || []) as Array<{
    tier: 'free' | 'friend' | 'owner'
    trip_limit: number | null
    feature_flags: unknown
  }>

  if (rows.length === 0) {
    return DEFAULT_ADMIN_CONFIG
  }

  const byTier = new Map(rows.map((row) => [row.tier, row]))

  return DEFAULT_ADMIN_CONFIG.map((fallback) => {
    const row = byTier.get(fallback.tier)
    if (!row) return fallback
    return {
      tier: row.tier,
      trip_limit: row.trip_limit,
      feature_flags: normalizeFlags(row.feature_flags),
    }
  })
}

export async function saveAdminConfig(input: {
  freeLimit: number
  friendLimit: number
  flags: FeatureFlags
}) {
  const supabase = await createClient()

  const rows = [
    { tier: 'free', trip_limit: input.freeLimit, feature_flags: input.flags },
    { tier: 'friend', trip_limit: input.friendLimit, feature_flags: input.flags },
    { tier: 'owner', trip_limit: null, feature_flags: input.flags },
  ]

  const { error } = await supabase.from('admin_config').upsert(rows, { onConflict: 'tier' })

  if (error) {
    throw new Error(`Failed to save admin config: ${error.message}`)
  }
}
