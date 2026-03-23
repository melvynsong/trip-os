import { cn } from '@/lib/utils/cn'
import type { MembershipTier } from '@/lib/membership/types'
import { hasAccess } from '@/lib/membership/access'

export type FeatureComingSoonProps = {
  /** Card title — e.g. "Google Search & Maps" */
  title: string
  /** Card description shown below the title */
  description: string
  /** The current user's membership tier */
  userTier: MembershipTier
  /** Tiers that have access to this feature */
  allowedTiers: MembershipTier[]
  /** Override the default CTA button label for locked users */
  ctaText?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Mock map preview — purely decorative skeleton shown for premium users
// ---------------------------------------------------------------------------
function MockMapPreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
      {/* Simulated map grid */}
      <div className="grid h-28 grid-cols-4 gap-px bg-gray-200">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-50" />
        ))}
      </div>

      {/* Overlay "coming soon" scrim */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2">
          {/* Map pin icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7 text-gray-300"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.71-5.12 3.61-9.079-.064-2.52-1.02-4.75-2.68-6.37A8.76 8.76 0 0012 2.25a8.76 8.76 0 00-6.22 2.628c-1.66 1.62-2.616 3.85-2.68 6.37-.1 3.959 1.666 7 3.61 9.079a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <div className="space-y-1 text-center">
            <div className="h-2 w-24 rounded-full bg-gray-200" />
            <div className="mx-auto h-2 w-16 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Simulated place result rows at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 space-y-1.5 bg-white/80 p-3 backdrop-blur-sm">
        {[80, 60, 70].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-200" />
            <div className={`h-2 rounded-full bg-gray-200`} style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FeatureComingSoon({
  title,
  description,
  userTier,
  allowedTiers,
  ctaText = 'Upgrade to Friend',
  className,
}: FeatureComingSoonProps) {
  const isPremiumUser = hasAccess(userTier, allowedTiers)

  if (isPremiumUser) {
    // -----------------------------------------------------------------------
    // Premium / coming-soon view — user has access, feature not live yet
    // -----------------------------------------------------------------------
    return (
      <div
        className={cn(
          'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm',
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {/* Coming Soon badge */}
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                Coming Soon
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
          </div>
          {/* Map icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-violet-500"
            >
              <path
                fillRule="evenodd"
                d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.934A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <MockMapPreview />

        <p className="mt-3 text-center text-xs text-gray-400">
          This feature is being built for you — check back soon.
        </p>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Free / upsell view — user does not have access
  // -------------------------------------------------------------------------
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm',
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {/* Friends Feature badge */}
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              Friends Feature
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-500">{description}</p>
        </div>
        {/* Lock icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 text-amber-500"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Faded preview rows */}
      <div className="mb-4 space-y-2 opacity-40" aria-hidden="true">
        {[90, 70, 80].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 rounded-full bg-gray-300" style={{ width: `${w}%` }} />
              <div className="h-2 rounded-full bg-gray-200" style={{ width: `${w - 20}%` }} />
            </div>
            <div className="h-2 w-8 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 active:bg-amber-200"
        // Step 2 / future: wire up upgrade flow here
        onClick={() => {}}
      >
        {ctaText}
      </button>
    </div>
  )
}
