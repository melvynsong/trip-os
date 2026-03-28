'use client'

import { useState, useCallback } from 'react'

export type ServiceCardData = {
  title: string
  description: string
  icon: React.ReactNode
  iconAccent?: 'blue' | 'orange'
}

export default function ServiceCard({ title, description, icon, iconAccent = 'blue' }: ServiceCardData) {
  const [nudged, setNudged] = useState(false)

  const handleClick = useCallback(() => {
    setNudged(true)
    setTimeout(() => setNudged(false), 3200)
  }, [])

  const iconBg =
    iconAccent === 'orange'
      ? 'bg-[var(--brand-accent-soft)] text-[var(--brand-accent)]'
      : 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      aria-label={`${title} — coming soon`}
      className="group relative flex cursor-pointer select-none flex-col gap-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-7 shadow-[0_2px_12px_rgba(28,25,23,0.05)] outline-none transition-all duration-200 hover:-translate-y-1 hover:border-[#2563eb]/30 hover:shadow-[0_10px_28px_rgba(37,99,235,0.13)] focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)] sm:p-8"
    >
      {/* Icon */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-base font-semibold text-[var(--text-strong)] sm:text-lg">{title}</h3>
        <p className="text-sm leading-7 text-[var(--text-subtle)]">{description}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-accent)]">
          Beta
        </span>
        <span className="rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
          Coming Soon
        </span>
      </div>

      {/* Coming-soon nudge */}
      <div
        aria-live="polite"
        className={`absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-2xl bg-[var(--brand-primary)] px-4 py-2.5 text-center text-xs font-medium text-white transition-all duration-300 ${nudged ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}`}
      >
        This beta service is still being prepared — check back soon.
      </div>
    </div>
  )
}
