'use client'

import { PLACE_TYPE_OPTIONS, type PlaceType } from '@/lib/places'

type PlaceTypeSelectorProps = {
  value: PlaceType
  onChange: (value: PlaceType) => void
}

export default function PlaceTypeSelector({ value, onChange }: PlaceTypeSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Place Type</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PLACE_TYPE_OPTIONS.map((option) => {
          const active = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                active
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <span className="mr-2">{option.emoji}</span>
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
