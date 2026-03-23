import type { ReactNode } from 'react'

export default function TimelineBlock({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl text-stone-900">{label}</h3>
          <p className="text-sm text-stone-500">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
