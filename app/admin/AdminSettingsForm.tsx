'use client'

import { useCallback, useState } from 'react'
import Button from '@/app/components/ui/Button'
import SectionContainer from '@/app/components/ui/SectionContainer'
import { FormField } from '@/app/components/ui/FormField'
import type { FeatureFlags } from '@/lib/admin-config'

const FLAG_ROWS: Array<{ key: keyof FeatureFlags; label: string }> = [
  { key: 'googlePlaces', label: 'Google Search & Places' },
  { key: 'tripDeletion', label: 'Trip deletion' },
  { key: 'aiFeatures', label: 'AI features' },
]

type Props = {
  initialFreeLimit: number
  initialFriendLimit: number
  initialFlags: FeatureFlags
  initialPackingBetaEnabled: boolean
}

export default function AdminSettingsForm({
  initialFreeLimit,
  initialFriendLimit,
  initialFlags,
  initialPackingBetaEnabled,
}: Props) {
  const [freeLimit, setFreeLimit] = useState<number>(initialFreeLimit)
  const [friendLimit, setFriendLimit] = useState<number>(initialFriendLimit)
  const [flags, setFlags] = useState<FeatureFlags>(initialFlags)
  const [packingBetaEnabled, setPackingBetaEnabled] = useState<boolean>(initialPackingBetaEnabled)

  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          freeLimit,
          friendLimit,
          flags,
          features: {
            packingBetaEnabled,
          },
        }),
      })

      const payload = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to save admin settings.')
      }

      setSuccessMessage('Admin settings saved successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save admin settings.')
    } finally {
      setIsSaving(false)
    }
  }, [flags, freeLimit, friendLimit, packingBetaEnabled])

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

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
              value={String(freeLimit)}
              onChange={(event) => setFreeLimit(Math.max(1, Number(event.target.value) || 1))}
              hint="Trips per calendar year"
            />
            <FormField
              label="Friend tier"
              name="friend_limit"
              type="number"
              min={1}
              value={String(friendLimit)}
              onChange={(event) => setFriendLimit(Math.max(1, Number(event.target.value) || 1))}
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
          </div>
          <div className="space-y-3">
            {FLAG_ROWS.map((row) => (
              <label key={row.key} className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-[var(--text-strong)]">{row.label}</p>
                  <p className="text-sm text-[var(--text-subtle)]">Stored for rollout control.</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags[row.key]}
                  onChange={(event) => {
                    const value = event.target.checked
                    setFlags((prev) => ({ ...prev, [row.key]: value }))
                  }}
                  className="h-4 w-4 rounded border-[var(--border-soft)] text-[var(--brand-primary)] focus:ring-[var(--ring-brand)]"
                />
              </label>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
              Beta features
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[var(--text-strong)]">Features</h2>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3">
            <div>
              <p className="font-medium text-[var(--text-strong)]">Packing (Beta)</p>
              <p className="text-sm text-[var(--text-subtle)]">
                Enable smart packing feature for Friends and Owner users.
              </p>
            </div>
            <input
              type="checkbox"
              checked={packingBetaEnabled}
              onChange={(event) => setPackingBetaEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-soft)] text-[var(--brand-primary)] focus:ring-[var(--ring-brand)]"
            />
          </label>
        </div>
      </SectionContainer>

      <div className="flex justify-end">
        <Button variant="primary" type="submit" loading={isSaving} className="rounded-full">
          {isSaving ? 'Saving…' : 'Save admin settings'}
        </Button>
      </div>
    </form>
  )
}
