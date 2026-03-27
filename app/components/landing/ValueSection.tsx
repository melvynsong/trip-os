const valuePoints = [
  'Plan your itinerary in one place',
  'Discover places and restaurants for your trip',
  'Organise your journey more easily',
  'Turn your trip into stories and memories you can share',
]

export default function ValueSection() {
  return (
    <section className="rounded-[2rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] px-6 py-8 shadow-[0_12px_32px_rgba(20,33,61,0.08)] sm:px-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Value</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">Travel planning that feels calm, clear, and memorable.</h2>
        <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate-700 sm:text-base">
          {valuePoints.map((item) => (
            <li key={item} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-strong)]">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
