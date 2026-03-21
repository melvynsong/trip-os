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
          className="w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none focus:border-gray-400 disabled:bg-gray-50"
        />

        {loading ? (
          <div className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
            Loading…
          </div>
        ) : null}
      </div>
    </div>
  )
}
