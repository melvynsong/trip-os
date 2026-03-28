import { cn } from '@/lib/utils/cn'

type BetaBadgeProps = {
  className?: string
  label?: string
}

export default function BetaBadge({ className, label = 'Beta' }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]',
        className
      )}
    >
      {label}
    </span>
  )
}