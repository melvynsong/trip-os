import { notFound } from 'next/navigation'
import Card from '@/app/components/ui/Card'
import { getCurrentUserMembership } from '@/lib/membership/server'
import { isOwnerTier } from '@/lib/membership/access'

const VERSION_HISTORY = [
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
            Internal timeline of major changes shipped to Trip-OS. Visible only to owner accounts.
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
