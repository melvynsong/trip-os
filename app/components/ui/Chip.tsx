import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export default function Chip({ className, selected = false, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-full border px-3.5 text-sm font-medium tracking-[-0.01em] transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)] focus-visible:ring-offset-1',
        selected
          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-sm'
          : 'border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--text-strong)] hover:bg-[var(--surface-muted)]',
        className
      )}
      {...props}
    />
  )
}
