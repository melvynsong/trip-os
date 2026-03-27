import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Button from '@/app/components/ui/Button'
import SectionContainer from '@/app/components/ui/SectionContainer'
import Pill from '@/app/components/ui/Pill'
import { FormField } from '@/app/components/ui/FormField'
import { getAdminConfig, saveAdminConfig } from '@/lib/admin-config'
import { getCurrentUserEntitlements } from '@/lib/entitlements'

const membershipRows = [
  { tier: 'free', label: 'Free', limitLabel: '1 trip / year' },
  { tier: 'friend', label: 'Friend', limitLabel: '3 trips / year' },
  { tier: 'owner', label: 'Owner', limitLabel: 'Unlimited' },
] as const

type Props = {
  searchParams?: Promise<{ status?: string }>
}

export default async function AdminPage({ searchParams }: Props) {
  const entitlements = await getCurrentUserEntitlements().catch(() => null)

  if (!entitlements?.isOwner) {
    redirect('/trips')
  }

  const params = searchParams ? await searchParams : undefined
  const config = await getAdminConfig()
  const freeRow = config.find((row) => row.tier === 'free')
  const friendRow = config.find((row) => row.tier === 'friend')
  const flags = freeRow?.feature_flags ?? {
    googlePlaces: true,
    tripDeletion: true,
    aiFeatures: true,
  }

  async function saveConfig(formData: FormData) {
    'use server'

    const ownerEntitlements = await getCurrentUserEntitlements().catch(() => null)
    if (!ownerEntitlements?.isOwner) {
      redirect('/trips')
    }

    const freeLimit = Number(formData.get('free_limit') || 1)
    const friendLimit = Number(formData.get('friend_limit') || 3)

    await saveAdminConfig({
      freeLimit: Number.isFinite(freeLimit) && freeLimit > 0 ? freeLimit : 1,
      friendLimit: Number.isFinite(friendLimit) && friendLimit > 0 ? friendLimit : 3,
      flags: {
        googlePlaces: formData.get('google_places') === 'on',
        tripDeletion: formData.get('trip_deletion') === 'on',
        aiFeatures: formData.get('ai_features') === 'on',
      },
    })

    revalidatePath('/admin')
    redirect('/admin?status=saved')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {params?.status === 'saved' ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Admin settings saved.
        </div>
      ) : null}

      <SectionContainer className="space-y-6">
        <div className="space-y-3">
          <Pill tone="brand">Owner admin</Pill>
          <div>
            <h1 className="font-serif text-4xl text-[var(--text-strong)] sm:text-5xl">Admin</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
              Internal configuration for trip limits and future feature flags. Feature toggles are informational today and do not restrict product access.
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
                    <p className="text-sm text-[var(--text-subtle)]">Everyone gets all features.</p>
                  </div>
                  <Pill tone={row.tier === 'friend' ? 'accent' : 'neutral'}>{row.limitLabel}</Pill>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>

        <form action={saveConfig} className="space-y-6">
          <SectionContainer>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
                  Trip limits
                </p>
                <h2 className="mt-2 font-serif text-2xl text-[var(--text-strong)]">Editable limits</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Free tier"
                  name="free_limit"
                  type="number"
                  min={1}
                  defaultValue={String(freeRow?.trip_limit ?? 1)}
                  hint="Trips per calendar year"
                />
                <FormField
                  label="Friend tier"
                  name="friend_limit"
                  type="number"
                  min={1}
                  defaultValue={String(friendRow?.trip_limit ?? 3)}
                  hint="Trips per calendar year"
                />
              </div>
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-subtle)]">
                Owner tier remains unlimited.
              </div>
            </div>
          </SectionContainer>

          <SectionContainer>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
                  Future toggles
                </p>
                <h2 className="mt-2 font-serif text-2xl text-[var(--text-strong)]">Feature flags</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--text-subtle)]">
                  These are stored now for future flexibility. They do not currently restrict live features.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  ['google_places', 'Google Search & Places', flags.googlePlaces],
                  ['trip_deletion', 'Trip deletion', flags.tripDeletion],
                  ['ai_features', 'AI features', flags.aiFeatures],
                ].map(([name, label, checked]) => (
                  <label key={String(name)} className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3">
                    <div>
                      <p className="font-medium text-[var(--text-strong)]">{label}</p>
                      <p className="text-sm text-[var(--text-subtle)]">Stored for future rollout control.</p>
                    </div>
                    <input
                      type="checkbox"
                      name={String(name)}
                      defaultChecked={Boolean(checked)}
                      className="h-4 w-4 rounded border-[var(--border-soft)] text-[var(--brand-primary)] focus:ring-[var(--ring-brand)]"
                    />
                  </label>
                ))}
              </div>
            </div>
          </SectionContainer>

          <div className="flex justify-end">
            <Button variant="primary" type="submit" className="rounded-full">
              Save admin settings
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
