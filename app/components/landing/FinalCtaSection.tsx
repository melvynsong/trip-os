import LoginButton from '@/app/components/auth/LoginButton'

export default function FinalCtaSection() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-stone-900 bg-stone-900 px-6 py-8 text-stone-50 shadow-[0_24px_80px_rgba(41,31,24,0.18)] sm:px-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-300">Start your story</p>
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Your next trip isn’t just a destination. It’s a story waiting to happen.
          </h2>
        </div>
        <div className="w-full max-w-sm">
          <LoginButton
            label="Start your first story"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
          />
        </div>
      </div>
    </section>
  )
}
