import { NextResponse } from 'next/server'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { saveAdminConfig, type FeatureFlags } from '@/lib/admin-config'
import { saveFeatureToggles } from '@/lib/feature-toggles'

export const runtime = 'nodejs'

type AdminSettingsPayload = {
  freeLimit: unknown
  friendLimit: unknown
  flags: unknown
  features: unknown
}

function asPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const rounded = Math.floor(n)
  return rounded > 0 ? rounded : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  return fallback
}

function parseFlags(input: unknown): FeatureFlags {
  const source = typeof input === 'object' && input !== null
    ? (input as Partial<FeatureFlags>)
    : {}

  return {
    googlePlaces: asBoolean(source.googlePlaces, true),
    tripDeletion: asBoolean(source.tripDeletion, true),
    aiFeatures: asBoolean(source.aiFeatures, true),
  }
}

function parsePackingToggle(input: unknown): boolean {
  const source = typeof input === 'object' && input !== null
    ? (input as { packingBetaEnabled?: unknown })
    : {}

  return asBoolean(source.packingBetaEnabled, true)
}

export async function POST(request: Request) {
  try {
    let membership
    try {
      membership = await getCurrentUserMembership()
    } catch {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    if (membership.tier !== 'owner') {
      return NextResponse.json({ error: 'Only Owner can change admin settings.' }, { status: 403 })
    }

    const body = (await request.json()) as Partial<AdminSettingsPayload>

    const freeLimit = asPositiveInt(body.freeLimit, 1)
    const friendLimit = asPositiveInt(body.friendLimit, 3)
    const flags = parseFlags(body.flags)
    const packingBetaEnabled = parsePackingToggle(body.features)

    await saveAdminConfig({
      freeLimit,
      friendLimit,
      flags,
    })

    await saveFeatureToggles(
      {
        packing_beta_enabled: packingBetaEnabled,
      },
      membership.userId
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while saving admin settings.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
