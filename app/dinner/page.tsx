import React from 'react'
import Link from 'next/link'
import PageHeader from '@/app/components/shared/PageHeader'
import { buttonClass } from '@/app/components/ui/Button'

export default function DinnerPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Dinner"
        subtitle="Plan your evening meal stop for the day."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Dinner planning is coming soon</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This page is ready as the entry point for the dinner flow. You can wire in restaurant
          suggestions, booking links, or a custom meal plan next.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/trips" className={buttonClass({ variant: 'primary' })}>
            Back to Trips
          </Link>
        </div>
      </section>
    </main>
  )
}