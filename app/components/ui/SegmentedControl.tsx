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
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
                selected
                  ? 'border-black bg-black text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
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
