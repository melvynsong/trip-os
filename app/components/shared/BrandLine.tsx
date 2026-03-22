import { cn } from '@/lib/utils/cn'

type BrandLineProps = {
  className?: string
  compact?: boolean
}

export default function BrandLine({ className, compact = false }: BrandLineProps) {
  return (
    <p
      className={cn(
        'font-medium tracking-wide text-gray-500',
        compact ? 'text-[11px] uppercase' : 'text-xs uppercase',
        className
      )}
    >
      Plan. Go. Share.
    </p>
  )
}
