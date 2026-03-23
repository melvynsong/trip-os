import LoginButton from '@/app/components/auth/LoginButton'

export default function FinalCtaSection() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-sky-500/30 bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#8b5cf6)] px-6 py-8 text-slate-50 shadow-[0_24px_80px_rgba(37,99,235,0.3)] sm:px-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Start your story</p>
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Your next trip isn’t just a destination. It’s a story waiting to happen.
          </h2>
        </div>
        <div className="w-full max-w-sm">
          <LoginButton
            label="Start your first story"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/70 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-50"
          />
        </div>
      </div>
    </section>
  )
}
