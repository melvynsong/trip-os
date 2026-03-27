const valuePoints = [
  { icon: '—', text: 'Plan your itinerary together in one place' },
  { icon: '—', text: 'Discover places and restaurants for your trip' },
  { icon: '—', text: 'Organise your journey simply and clearly' },
  { icon: '—', text: 'Turn your trip into stories and memories worth sharing' },
]

export default function ValueSection() {
  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-7 py-10 shadow-[0_2px_12px_rgba(28,25,23,0.06)] sm:px-10 sm:py-12">
      <div className="max-w-xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">What it does</p>
          <h2 className="mt-3 font-serif text-3xl leading-snug text-[var(--text-strong)]">
            Travel planning that feels calm, clear, and memorable.
          </h2>
        </div>
        <ul className="space-y-3">
          {valuePoints.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm text-[var(--text-subtle)] sm:text-base">
              <span className="font-medium text-[var(--brand-primary)]">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
