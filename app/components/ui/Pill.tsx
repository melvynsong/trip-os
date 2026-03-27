import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export default function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'accent'
  className?: string
}) {
  const toneClass =
    tone === 'brand'
      ? 'border-[color:var(--brand-primary)]/12 bg-[color:var(--brand-primary-soft)] text-[var(--brand-primary)]'
      : tone === 'accent'
        ? 'border-orange-200 bg-orange-50 text-orange-700'
        : 'border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-subtle)]'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.01em]',
        toneClass,
        className
      )}
    >
      {children}
    </span>
  )
}
