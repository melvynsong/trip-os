const tiers = [
  {
    title: 'Free Tier',
    eyebrow: 'A simple way to begin',
    items: ['Sign in with Google', 'Create 1 trip per year', 'Basic recommendations'],
  },
  {
    title: 'Friends Tier',
    eyebrow: 'For deeper planning',
    items: [
      'Please contact me',
      'Create up to 3 trips per year',
      'Google-powered search',
      'AI assistant for planning and trip organisation',
    ],
  },
]

export default function AccessSection() {
  return (
    <section className="space-y-5">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Access</p>
        <h2 className="font-serif text-3xl text-slate-900">Simple access while the product grows with care.</h2>
        <p className="text-sm leading-7 text-slate-600 sm:text-base">
          These tiers are shown here for clarity only. Actual entitlement logic stays exactly where it already lives.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {tiers.map((tier, index) => (
          <section
            key={tier.title}
            className={`rounded-[2rem] border px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:px-8 ${
              index === 0
                ? 'border-slate-200 bg-white'
                : 'border-cyan-200 bg-[linear-gradient(135deg,rgba(240,253,250,1),rgba(239,246,255,1))]'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{tier.eyebrow}</p>
            <h3 className="mt-3 font-serif text-2xl text-slate-900">{tier.title}</h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
              {tier.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500/80" />
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
