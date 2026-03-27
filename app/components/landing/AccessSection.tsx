const tiers = [
  {
    title: 'Free',
    eyebrow: 'A simple way to begin',
    items: ['Sign in with Google', 'Create 1 trip per year', 'Basic recommendations'],
  },
  {
    title: 'Friends',
    eyebrow: 'For deeper planning together',
    items: [
      'Please contact me',
      'Create up to 3 trips per year',
      'Google-powered place search',
      'AI assistant for planning and storytelling',
    ],
  },
]

export default function AccessSection() {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">Access</p>
        <h2 className="font-serif text-3xl text-[var(--text-strong)]">
          Simple access while the product grows with care.
        </h2>
        <p className="text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
          These tiers are shown here for clarity. Access is intentionally limited to refine the experience.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {tiers.map((tier, index) => (
          <section
            key={tier.title}
            className={`rounded-2xl border px-7 py-8 shadow-[0_2px_12px_rgba(28,25,23,0.06)] sm:px-8 ${
              index === 0
                ? 'border-[var(--border-soft)] bg-[var(--surface-panel)]'
                : 'border-[var(--brand-primary)]/20 bg-[var(--brand-primary-soft)]'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">{tier.eyebrow}</p>
            <h3 className="mt-3 font-serif text-2xl text-[var(--text-strong)]">{tier.title}</h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
              {tier.items.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
