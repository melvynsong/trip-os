import LoginButton from '@/app/components/auth/LoginButton'
import BrandLine from '@/app/components/shared/BrandLine'
import { branding } from '@/lib/branding'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border-soft)] bg-[linear-gradient(150deg,#ebf2ff_0%,#f6f8fc_45%,#ffffff_100%)] px-6 py-10 shadow-[0_16px_48px_rgba(20,33,61,0.12)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(51,104,255,0.22),transparent_58%)]" />
      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-strong)]">
              Travel planning, beautifully told
            </div>
            <div>
              <p className="text-5xl font-semibold leading-none text-[var(--text-strong)] sm:text-6xl">
                {branding.appName}
              </p>
              <BrandLine className="mt-4 text-[var(--text-subtle)]" />
            </div>
          </div>

          <div className="space-y-3 text-base leading-8 text-slate-700 sm:text-lg">
            <p>Every trip begins with an idea.</p>
            <p>A place you want to go.</p>
            <p>A moment you want to experience.</p>
            <p>A story waiting to be told.</p>
          </div>

          <div className="space-y-4 text-base leading-7 text-slate-700">
            <p>{branding.appName} helps you through the whole journey:</p>
            <ul className="space-y-3 text-slate-800">
              <li><span className="font-semibold text-[var(--text-strong)]">To</span> — plan with clarity</li>
              <li><span className="font-semibold text-[var(--text-strong)]">Go</span> — experience with ease</li>
              <li><span className="font-semibold text-[var(--text-strong)]">Story</span> — capture and share what matters</li>
            </ul>
          </div>

          <p className="text-lg font-medium text-[var(--text-strong)] sm:text-xl">
            We don’t just travel. We collect stories.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--border-soft)] bg-white p-6 shadow-[0_14px_38px_rgba(20,33,61,0.12)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Start here
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text-strong)]">
            Bring planning, moments, and memories into one thoughtful home.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
            Sign in once, plan with calm clarity, and turn the details of your journey into something worth sharing.
          </p>
          <div className="mt-8">
            <LoginButton className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-transparent bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(51,104,255,0.3)] transition hover:bg-[#2f61ed] active:bg-[var(--brand-primary-press)]" />
          </div>
          <p className="mt-4 text-xs leading-6 text-[var(--text-subtle)]">
            Google sign-in only. Your trip planning stays tied to your account and tier access.
          </p>
        </div>
      </div>
    </section>
  )
}
