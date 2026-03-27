import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export default function SectionContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)] sm:p-8',
        className
      )}
    >
      {children}
    </section>
  )
}
