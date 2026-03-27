import { cn } from '@/lib/utils/cn'

type SegmentedOption<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  columns?: number
}

export default function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
}: SegmentedControlProps<T>) {
  const cols = columns ?? Math.min(options.length, 3)
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">{label}</p>
      <div
        className="grid gap-1.5 rounded-xl bg-[var(--surface-muted)] p-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-10 rounded-lg border px-2 py-2 text-center text-sm font-medium tracking-[-0.01em] transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)]',
                selected
                  ? 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] shadow-sm'
                  : 'border-transparent bg-transparent text-[var(--text-subtle)] hover:text-[var(--text-strong)] hover:bg-white/60'
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
