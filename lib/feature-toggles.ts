import { createClient } from '@/lib/supabase/server'
import { hasAccess } from '@/lib/membership/access'
import type { MembershipTier } from '@/lib/membership/types'

export const FEATURE_TOGGLE_KEYS = ['packing_beta_enabled', 'flight_beta_enabled'] as const

export type FeatureToggleKey = (typeof FEATURE_TOGGLE_KEYS)[number]

export type FeatureToggles = Record<FeatureToggleKey, boolean>

const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  packing_beta_enabled: true,
  flight_beta_enabled: true,
}

type AppSettingRow = {
  setting_key: FeatureToggleKey
  setting_value: unknown
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  if (typeof value === 'object' && value !== null && 'enabled' in value) {
    const enabled = (value as { enabled?: unknown }).enabled
    if (typeof enabled === 'boolean') return enabled
  }
  return fallback
}

function normalizeToggleValue(key: FeatureToggleKey, value: unknown): boolean {
  return toBoolean(value, DEFAULT_FEATURE_TOGGLES[key])
}

export async function getFeatureToggles(): Promise<FeatureToggles> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('app_settings')
    .select('setting_key, setting_value')
    .in('setting_key', FEATURE_TOGGLE_KEYS)

  if (error || !data) {
    return DEFAULT_FEATURE_TOGGLES
  }

  const rows = data as AppSettingRow[]
  const byKey = new Map(rows.map((row) => [row.setting_key, row.setting_value]))

  return FEATURE_TOGGLE_KEYS.reduce((acc, key) => {
    acc[key] = normalizeToggleValue(key, byKey.get(key))
    return acc
  }, { ...DEFAULT_FEATURE_TOGGLES } as FeatureToggles)
}

export async function isFeatureEnabled(key: FeatureToggleKey): Promise<boolean> {
  const toggles = await getFeatureToggles()
  return toggles[key]
}

export async function saveFeatureToggles(
  updates: Partial<FeatureToggles>,
  updatedBy: string
): Promise<void> {
  const supabase = await createClient()

  const rows = FEATURE_TOGGLE_KEYS.filter((key) => key in updates).map((key) => ({
    setting_key: key,
    setting_value: updates[key] ?? DEFAULT_FEATURE_TOGGLES[key],
    updated_by: updatedBy,
  }))

  if (rows.length === 0) return

  const { error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'setting_key' })

  if (error) {
    throw new Error(`Failed to save feature toggles: ${error.message}`)
  }
}

export type TieredFeatureAccessState = {
  hasRequiredTier: boolean
  isEnabledByAdmin: boolean
  canAccess: boolean
}

async function getTieredFeatureAccessState(input: {
  userTier: MembershipTier
  featureKey: FeatureToggleKey
}): Promise<TieredFeatureAccessState> {
  const hasRequiredTier = hasAccess(input.userTier, ['friend', 'owner'])
  const isEnabledByAdmin = await isFeatureEnabled(input.featureKey)

  return {
    hasRequiredTier,
    isEnabledByAdmin,
    canAccess: hasRequiredTier && isEnabledByAdmin,
  }
}

export type PackingAccessState = TieredFeatureAccessState

export async function getPackingAccessState(
  userTier: MembershipTier
): Promise<PackingAccessState> {
  return getTieredFeatureAccessState({
    userTier,
    featureKey: 'packing_beta_enabled',
  })
}

export type FlightAccessState = TieredFeatureAccessState

export async function getFlightAccessState(
  userTier: MembershipTier
): Promise<FlightAccessState> {
  return getTieredFeatureAccessState({
    userTier,
    featureKey: 'flight_beta_enabled',
  })
}
