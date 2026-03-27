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
}

export default function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{label}</p>
      <div
        className="grid gap-2 rounded-2xl bg-[var(--surface-muted)] p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)]',
                selected
                  ? 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] shadow-sm'
                  : 'border-transparent bg-transparent text-[var(--text-subtle)] hover:bg-white/70 active:bg-white'
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
