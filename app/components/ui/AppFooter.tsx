import Logo from '@/app/components/shared/Logo'
import BetaVersionPill from '@/app/components/ui/BetaVersionPill'
import { APP_VERSION } from '@/lib/config/app'
import { isOwnerTier } from '@/lib/membership/access'
import { getCurrentUserMembership } from '@/lib/membership/server'

export default async function AppFooter() {
  let ownerHistoryHref: string | undefined

  try {
    const membership = await getCurrentUserMembership()
    if (isOwnerTier(membership.tier)) {
      ownerHistoryHref = '/owner/history'
    }
  } catch {
    ownerHistoryHref = undefined
  }

  return (
    <footer className="mt-14 border-t border-[var(--border-soft)] bg-[var(--surface-muted)]/65">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/" variant="icon" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--text-strong)]">ToGoStory - Plan . Go . Share</p>
            <p className="truncate text-[11px] text-[var(--text-subtle)]">Currently in Beta</p>
          </div>
        </div>

        <BetaVersionPill version={APP_VERSION} ownerHistoryHref={ownerHistoryHref} />
      </div>
    </footer>
  )
}
