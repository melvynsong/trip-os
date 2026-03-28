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
}

export default function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  disabled = false,
  columns,
}: SegmentedControlProps<T>) {
  const columnCount = columns ?? options.length

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">{label}</p>
      ) : null}
      <div
        className={cn(
          'grid w-full gap-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-1',
          disabled && 'opacity-60'
        )}
        style={{ gridTemplateColumns: `repeat(${Math.max(columnCount, 1)}, minmax(0, 1fr))` }}
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
                'rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)]',
                active
                  ? 'bg-white text-[var(--text-strong)] shadow-sm'
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
