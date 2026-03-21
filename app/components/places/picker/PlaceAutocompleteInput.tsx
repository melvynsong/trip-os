'use client'

type PlaceAutocompleteInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
}

export default function PlaceAutocompleteInput({
  value,
  onChange,
  disabled,
  loading,
}: PlaceAutocompleteInputProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Search Place</label>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Type at least 2 characters"
          className="h-11 w-full rounded-xl border border-gray-200 px-3 pr-14 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10 disabled:bg-gray-50"
        />

        {loading ? (
          <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 text-xs text-gray-400">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading…
          </div>
        ) : null}
      </div>
    </div>
  )
}
