import Link from 'next/link'
import { redirect } from 'next/navigation'
import BrandLine from '@/app/components/shared/BrandLine'
import { buttonClass } from '@/app/components/ui/Button'
import { branding } from '@/lib/branding'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { createClient } from '@/lib/supabase/server'
import { getTierLabel, getUserDisplayName } from '@/lib/user-display'

export default async function Navigation() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let viewer: { name: string; tierLabel: string } | null = null

  if (user) {
    const membership = await getCurrentUserMembership().catch(() => null)
    const resolvedTier = membership?.tier ?? 'free'

    viewer = {
      name: getUserDisplayName(user),
      tierLabel: getTierLabel(resolvedTier),
    }
  }

  async function logoutAction() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <nav className="border-b border-[var(--border-soft)] bg-[var(--background)]/95 text-[var(--text-strong)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-xl px-2 py-1 transition hover:bg-[var(--surface-muted)] active:scale-[0.98]"
        >
          <div className="font-serif text-2xl text-[var(--text-strong)]">{branding.appName}</div>
          <BrandLine compact className="mt-0.5" />
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href={user ? '/trips' : '/'}
            className={buttonClass({
              variant: 'ghost',
              size: 'sm',
              className: 'rounded-full',
            })}
          >
            {user ? 'Stories' : 'Home'}
          </Link>

          {viewer ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-2 text-sm text-[var(--text-subtle)] shadow-sm">
                {viewer.name} · {viewer.tierLabel}
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={buttonClass({
                    variant: 'secondary',
                    size: 'sm',
                    className: 'rounded-full',
                  })}
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}