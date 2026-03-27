import LoginButton from '@/app/components/auth/LoginButton'

export default function FinalCtaSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-7 py-12 shadow-[0_2px_16px_rgba(15,23,42,0.05)] sm:px-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-accent)]">
            Begin your journey
          </p>
          <h2 className="font-serif text-3xl leading-snug text-[var(--text-strong)] sm:text-4xl">
            Your next trip isn’t just a destination.
            <br className="hidden sm:block" />
            It’s a story waiting to happen.
          </h2>
          <p className="text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
            Plan with people you love. Experience it together. Tell the story.
          </p>
        </div>
        <div className="w-full max-w-xs shrink-0">
          <LoginButton
            label="Start your first story"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-transparent bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)] transition hover:bg-[var(--brand-primary-hover)]"
          />
        </div>
      </div>
    </section>
  )
}
