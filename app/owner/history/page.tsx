import { notFound } from 'next/navigation'
import Card from '@/app/components/ui/Card'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { isOwnerTier } from '@/lib/membership/access'

const VERSION_HISTORY = [
  {
    date: '28 March 2026',
    version: 'v2026.03.28',
    title: 'Trip creation UX + itinerary intelligence enhancements',
    improvements: [
      'Introduced reusable TripDateRangePicker with smarter defaults, strict end-date validation, and clearer inline feedback.',
      'Replaced free-text destination entry with structured multi-select LocationSelector for city/country chips, keyboard navigation, duplicate prevention, and loading/empty states.',
      'Added reusable location clustering service to group selected destinations by country for planning and itinerary use cases.',
      'Upgraded Trips homepage with upcoming-first sorting, nearest-trip highlight, and countdown labels (today/tomorrow/in X days).',
      'Refactored shared trip utilities/components to improve consistency, scalability, and maintenance without breaking existing flows.',
    ],
  },
  {
    date: '27 March 2026',
    version: 'v2026.03.27',
    title: 'Beta controls + packing share improvements',
    improvements: [
      'Stabilized Admin save flow with better validation, owner-only protection, and clear success/error feedback.',
      'Added centralized feature toggle support and shipped global packing_beta_enabled control via app settings.',
      'Enforced Packing (Beta) access using both membership tier (Friend/Owner) and admin toggle across UI and API.',
      'Added WhatsApp sharing for generated packing lists with concise formatted message output.',
      'Updated UI labels from Alpha to Beta and marked Packing list entry with a Beta pill for consistency.',
    ],
  },
  {
    date: '26 March 2026',
    version: 'v2026.03.26',
    title: 'Story permissions stability fix',
    improvements: [
      'Patched stories permission issue via SQL migration to reduce access errors.',
      'Kept existing story generation flow unchanged while tightening data access.',
    ],
  },
  {
    date: '23 March 2026',
    version: 'v2026.03.23',
    title: 'Google source + membership tier updates',
    improvements: [
      'Added migration support for Google source data.',
      'Applied tier updates for free/friend owner test accounts to align access behavior.',
    ],
  },
  {
    date: '21 March 2026',
    version: 'v2026.03.21',
    title: 'Core refactor + deployment visibility',
    improvements: [
      'Completed Phase 1–3 refactor: extracted reusable cards and shared utility/types.',
      'Added global deployment footer so every page shows deployed version timestamp.',
      'Validated production build and kept all key trip and itinerary features intact.',
    ],
  },
] as const

export const metadata = {
  title: 'Owner History',
}

export default async function OwnerHistoryPage() {
  const membership = await getCurrentUserMembership()

  if (!isOwnerTier(membership.tier)) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Owner View</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Version & Improvement History</h1>
          <p className="text-sm text-slate-600">
            Internal timeline of major changes shipped to ToGoStory. Visible only to owner accounts.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {VERSION_HISTORY.map((entry) => (
            <Card key={entry.version} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{entry.date}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{entry.title}</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {entry.version}
                </span>
              </div>

              <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
                {entry.improvements.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
