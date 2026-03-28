import { redirect } from 'next/navigation'
import SectionContainer from '@/app/components/ui/SectionContainer'
import Pill from '@/app/components/ui/Pill'
import AdminSettingsForm from '@/app/admin/AdminSettingsForm'
import { getAdminConfigWithMeta } from '@/lib/admin-config'
import { getFeatureToggles } from '@/lib/feature-toggles'
import { getCurrentUserEntitlements } from '@/lib/entitlements'

const membershipRows = [
  { tier: 'free', label: 'Free', limitLabel: '1 trip / year' },
  { tier: 'friend', label: 'Friend', limitLabel: '3 trips / year' },
  { tier: 'owner', label: 'Owner', limitLabel: 'Unlimited' },
] as const

export default async function AdminPage() {
  const entitlements = await getCurrentUserEntitlements().catch(() => null)

  if (!entitlements?.isOwner) {
    redirect('/trips')
  }

  const configResult = await getAdminConfigWithMeta()
  const config = configResult.config
  const featureToggles = await getFeatureToggles()
  const freeRow = config.find((row) => row.tier === 'free')
  const friendRow = config.find((row) => row.tier === 'friend')
  const flags = freeRow?.feature_flags ?? {
    googlePlaces: true,
    tripDeletion: true,
    aiFeatures: true,
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {configResult.source === 'fallback' ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Admin settings are using fallback defaults. Save may fail until database setup is complete.
          {configResult.errorMessage ? ` (${configResult.errorMessage})` : ''}
        </div>
      ) : null}

      <SectionContainer className="space-y-6">
        <div className="space-y-3">
          <Pill tone="brand">Owner admin</Pill>
          <div>
            <h1 className="font-serif text-4xl text-[var(--text-strong)] sm:text-5xl">Admin</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
              Internal configuration for trip limits and beta feature controls.
            </p>
          </div>
        </div>
      </SectionContainer>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionContainer>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
                Membership overview
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--text-strong)]">Current access model</h2>
            </div>
            <div className="space-y-3">
              {membershipRows.map((row) => (
                <div key={row.tier} className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3">
                  <div>
                    <p className="font-medium text-[var(--text-strong)]">{row.label}</p>
                    <p className="text-sm text-[var(--text-subtle)]">Feature access is tier-aware and admin-controlled where applicable.</p>
                  </div>
                  <Pill tone={row.tier === 'friend' ? 'accent' : 'neutral'}>{row.limitLabel}</Pill>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>

        <AdminSettingsForm
          initialFreeLimit={Math.max(1, freeRow?.trip_limit ?? 1)}
          initialFriendLimit={Math.max(1, friendRow?.trip_limit ?? 3)}
          initialFlags={flags}
          initialPackingBetaEnabled={featureToggles.packing_beta_enabled}
          initialFlightBetaEnabled={featureToggles.flight_beta_enabled}
        />
      </div>
    </main>
  )
}
