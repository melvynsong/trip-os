import { cn } from '@/lib/utils/cn'

type BrandLineProps = {
  className?: string
  compact?: boolean
}

export default function BrandLine({ className, compact = false }: BrandLineProps) {
  return (
    <p
      className={cn(
        'font-medium tracking-[0.22em] text-[var(--text-subtle)]',
        compact ? 'text-[10px] uppercase' : 'text-xs uppercase',
        className
      )}
    >
      To · Go · Story
    </p>
  )
}
