import { cn } from '@/lib/utils/cn'
import type { MembershipTier } from '@/lib/membership/types'
import { hasAccess } from '@/lib/membership/access'

type PreviewMode = 'default' | 'place-discovery'

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
  previewMode?: PreviewMode
  helperText?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Default preview used by the places page placeholder
// ---------------------------------------------------------------------------
function DefaultMockMapPreview() {
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

function StarRating({ rating }: { rating: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-100">
      <span>★</span>
      <span>{rating}</span>
    </div>
  )
}

function PlaceDiscoveryPreview({ locked = false }: { locked?: boolean }) {
  const mockResults = [
    { name: 'Din Tai Fung', rating: '4.7', meta: 'Restaurant · 8 min away' },
    { name: 'National Palace Museum', rating: '4.8', meta: 'Attraction · Top-rated' },
    { name: 'Fuhang Soy Milk', rating: '4.5', meta: 'Breakfast · Local favorite' },
  ]

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white',
        locked && 'opacity-85'
      )}
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 p-3 sm:p-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 shadow-inner">
          Search places, restaurants, and attractions
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3 p-3 sm:p-4">
          {mockResults.map((result, index) => (
            <div
              key={result.name}
              className={cn(
                'rounded-xl border border-gray-100 bg-white p-3 shadow-sm',
                index === 0 && !locked && 'ring-1 ring-violet-100'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{result.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{result.meta}</p>
                </div>
                <StarRating rating={result.rating} />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4 md:border-l md:border-t-0">
          <div className="relative h-full min-h-44 overflow-hidden rounded-2xl border border-gray-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_45%,#ecfeff_100%)] shadow-inner">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute left-6 top-5 h-24 w-24 rounded-full border border-cyan-200/70" />
              <div className="absolute right-8 top-10 h-20 w-20 rounded-full border border-violet-200/70" />
              <div className="absolute bottom-8 left-10 right-10 h-px bg-sky-200" />
              <div className="absolute left-1/4 top-0 bottom-0 w-px bg-cyan-100" />
              <div className="absolute left-0 right-0 top-1/3 h-px bg-cyan-100" />
              <div className="absolute left-0 right-0 top-2/3 h-px bg-cyan-100" />
            </div>

            <div className="absolute left-[20%] top-[28%] h-3 w-3 rounded-full bg-violet-500 ring-4 ring-violet-200/80" />
            <div className="absolute right-[22%] top-[38%] h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200/80" />
            <div className="absolute left-[40%] bottom-[24%] h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-200/80" />

            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/88 p-3 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Map preview</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Ratings, map pins, and discovery results in one place</p>
                </div>
                <div className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
                  Preview
                </div>
              </div>
            </div>

            {locked ? (
              <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" aria-hidden="true" />
            ) : null}
          </div>
        </div>
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
  previewMode = 'default',
  helperText,
  className,
}: FeatureComingSoonProps) {
  const isPremiumUser = hasAccess(userTier, allowedTiers)
  const preview =
    previewMode === 'place-discovery' ? (
      <PlaceDiscoveryPreview locked={!isPremiumUser} />
    ) : (
      <DefaultMockMapPreview />
    )

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

        {preview}

        <p className="mt-3 text-center text-xs text-gray-400">
          {helperText || 'This feature is being built for you — check back soon.'}
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

      <div className="mb-4">{preview}</div>

      {helperText ? <p className="mb-4 text-xs text-gray-500">{helperText}</p> : null}

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
