export default function AlphaSection() {
  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-7 py-10 shadow-[0_2px_12px_rgba(28,25,23,0.06)] sm:px-10 sm:py-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">Alpha</p>
        <h2 className="font-serif text-3xl text-[var(--text-strong)]">
          ToGoStory is useful already — and still evolving.
        </h2>
        <div className="space-y-3 text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
          <p>ToGoStory is currently in alpha.</p>
          <p>It is already useful, but still evolving.</p>
          <p>
            Features may change and performance may vary, but the core experience stays consistent for everyone while we keep improving the product.
          </p>
        </div>
      </div>
    </section>
  )
}
