import LoginButton from '@/app/components/auth/LoginButton'
import BrandLine from '@/app/components/shared/BrandLine'
import { branding } from '@/lib/branding'

export default function HeroSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-[0_2px_20px_rgba(28,25,23,0.07)] sm:rounded-3xl">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        {/* Left — brand + narrative */}
        <div className="space-y-8 px-7 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
              Travel planning, beautifully told
            </p>
            <div>
              <h1 className="font-serif text-5xl leading-none text-[var(--text-strong)] sm:text-6xl">
                {branding.appName}
              </h1>
              <BrandLine className="mt-3" />
            </div>
          </div>

          <div className="space-y-3 text-base leading-8 text-[var(--text-subtle)] sm:text-lg">
            <p>Every trip begins with an idea.</p>
            <p>A place you want to go.</p>
            <p>A moment you want to experience.</p>
            <p>A story waiting to be told.</p>
          </div>

          <div className="space-y-3 text-base leading-7">
            <p className="font-medium text-[var(--text-strong)]">{branding.appName} is built around three intentions:</p>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold text-[var(--text-strong)]">To</span>
                <span className="text-[var(--text-subtle)]"> — plan together with clarity</span>
              </li>
              <li>
                <span className="font-semibold text-[var(--brand-accent)]">Go</span>
                <span className="text-[var(--text-subtle)]"> — experience and share with ease</span>
              </li>
              <li>
                <span className="font-semibold text-[var(--text-strong)]">Story</span>
                <span className="text-[var(--text-subtle)]"> — remember and tell it together</span>
              </li>
            </ul>
          </div>

          <p className="text-base font-medium text-[var(--text-strong)] sm:text-lg">
            We don’t just travel. We collect stories.
          </p>
        </div>

        {/* Right — sign-in card */}
        <div className="flex flex-col justify-center border-t border-[var(--border-soft)] bg-[var(--surface-muted)] px-7 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-10 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            Start your story
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-snug text-[var(--text-strong)] sm:text-3xl">
            Bring planning, moments, and memories into one thoughtful home.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
            Sign in once, plan with calm clarity, and turn the details of your journey into something worth sharing.
          </p>
          <div className="mt-8">
            <LoginButton className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-transparent bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)] transition hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-press)]" />
          </div>
          <p className="mt-4 text-xs leading-6 text-[var(--text-subtle)]">
            Google sign-in. Your trip planning stays private and personal.
          </p>
        </div>
      </div>
    </section>
  )
}

