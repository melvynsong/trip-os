import { cn } from '@/lib/utils/cn'

type SegmentedOption<T extends string> = {
  label: string
  value: T
}

type SegmentedControlProps<T extends string> = {
  label?: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
  disabled?: boolean
  columns?: number
  layout?: 'grid' | 'wrap'
}

export default function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  disabled = false,
  columns,
  layout = 'grid',
}: SegmentedControlProps<T>) {
  const columnCount = columns ?? options.length

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">{label}</p>
      ) : null}
      <div
        className={cn(
          layout === 'wrap'
            ? 'flex w-full flex-wrap gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-2'
            : 'grid w-full gap-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-1',
          disabled && 'opacity-60'
        )}
        style={
          layout === 'grid'
            ? { gridTemplateColumns: `repeat(${Math.max(columnCount, 1)}, minmax(0, 1fr))` }
            : undefined
        }
        role="tablist"
        aria-disabled={disabled}
      >
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                layout === 'wrap'
                  ? 'max-w-full rounded-full px-3 py-1.5 text-left text-sm font-medium leading-5 whitespace-normal break-words transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)]'
                  : 'rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)]',
                active
                  ? 'bg-white text-[var(--brand-primary)] shadow-[0_2px_8px_rgba(255,122,26,0.08)] ring-1 ring-[var(--brand-primary)]'
                  : 'text-[var(--text-subtle)] hover:text-[var(--text-strong)]',
                disabled && 'cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
