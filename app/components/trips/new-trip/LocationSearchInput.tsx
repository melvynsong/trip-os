'use client'

import type { KeyboardEvent } from 'react'

type LocationSearchInputProps = {
  value: string
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
  loading?: boolean
  inputId: string
}

export default function LocationSearchInput({
  value,
  onChange,
  onKeyDown,
  disabled,
  loading,
  inputId,
}: LocationSearchInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-strong)]">
        Destinations
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="Search city or country"
          className="h-11 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 pr-12 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--ring-brand)] disabled:bg-[var(--surface-muted)]"
          aria-autocomplete="list"
        />

        {loading ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-subtle)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </span>
        ) : null}
      </div>
    </div>
  )
}
