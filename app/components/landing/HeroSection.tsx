import LoginButton from '@/app/components/auth/LoginButton'
import BrandLine from '@/app/components/shared/BrandLine'
import { branding } from '@/lib/branding'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,243,235,0.92))] px-6 py-10 shadow-[0_24px_80px_rgba(41,31,24,0.08)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(214,181,132,0.25),transparent_55%)]" />
      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-amber-900/80">
              Travel planning, beautifully told
            </div>
            <div>
              <p className="font-serif text-5xl leading-none text-stone-900 sm:text-6xl">
                {branding.appName}
              </p>
              <BrandLine className="mt-4 text-stone-500" />
            </div>
          </div>

          <div className="space-y-3 text-base leading-8 text-stone-700 sm:text-lg">
            <p>Every trip begins with an idea.</p>
            <p>A place you want to go.</p>
            <p>A moment you want to experience.</p>
            <p>A story waiting to be told.</p>
          </div>

          <div className="space-y-4 text-base leading-7 text-stone-700">
            <p>{branding.appName} helps you through the whole journey:</p>
            <ul className="space-y-3 text-stone-800">
              <li><span className="font-semibold text-stone-900">To</span> — plan with clarity</li>
              <li><span className="font-semibold text-stone-900">Go</span> — experience with ease</li>
              <li><span className="font-semibold text-stone-900">Story</span> — capture and share what matters</li>
            </ul>
          </div>

          <p className="text-lg font-medium text-stone-900 sm:text-xl">
            We don’t just travel. We collect stories.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-stone-200 bg-white/80 p-6 shadow-[0_18px_50px_rgba(41,31,24,0.08)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Start here
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-stone-900">
            Bring planning, moments, and memories into one thoughtful home.
          </h2>
          <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
            Sign in once, plan with calm clarity, and turn the details of your journey into something worth sharing.
          </p>
          <div className="mt-8">
            <LoginButton className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(41,31,24,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-800" />
          </div>
          <p className="mt-4 text-xs leading-6 text-stone-500">
            Google sign-in only. Your trip planning stays tied to your account and tier access.
          </p>
        </div>
      </div>
    </section>
  )
}
