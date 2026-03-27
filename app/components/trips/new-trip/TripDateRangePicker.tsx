'use client'

import { useMemo } from 'react'
import { FormField } from '../../ui/FormField'
import { getMinEndDate, getSuggestedEndDate, isEndDateAfterStartDate } from '../../../../lib/trips/date'

type TripDateRangePickerProps = {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  disabled?: boolean
}

export default function TripDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled,
}: TripDateRangePickerProps) {
  const minEndDate = useMemo(() => getMinEndDate(startDate), [startDate])

  const showDateOrderError = Boolean(startDate && endDate && !isEndDateAfterStartDate(startDate, endDate))

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          type="date"
          id="startDate"
          label="Start date"
          value={startDate}
          onChange={(event) => {
            const nextStartDate = event.target.value
            onStartDateChange(nextStartDate)

            if (!nextStartDate) return

            const suggestedEndDate = getSuggestedEndDate(nextStartDate)
            if (!suggestedEndDate) return

            if (!endDate || !isEndDateAfterStartDate(nextStartDate, endDate)) {
              onEndDateChange(suggestedEndDate)
            }
          }}
          disabled={disabled}
        />

        <FormField
          type="date"
          id="endDate"
          label="End date"
          value={endDate}
          min={minEndDate ?? undefined}
          onFocus={() => {
            if (!startDate || endDate) return
            const suggestedEndDate = getSuggestedEndDate(startDate)
            if (suggestedEndDate) {
              onEndDateChange(suggestedEndDate)
            }
          }}
          onChange={(event) => onEndDateChange(event.target.value)}
          disabled={disabled || !startDate}
          aria-invalid={showDateOrderError}
        />
      </div>

      {showDateOrderError ? (
        <p className="text-sm text-red-700">End date must be after start date</p>
      ) : null}
    </div>
  )
}
