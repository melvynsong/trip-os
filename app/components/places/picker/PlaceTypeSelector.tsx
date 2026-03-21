'use client'

import { PLACE_TYPE_OPTIONS, type PlaceType } from '@/lib/places'
import Chip from '@/app/components/ui/Chip'

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
            <Chip
              key={option.value}
              onClick={() => onChange(option.value)}
              selected={active}
              className="justify-start rounded-xl px-3 py-2 text-left"
            >
              <span className="mr-2">{option.emoji}</span>
              {option.label}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}
