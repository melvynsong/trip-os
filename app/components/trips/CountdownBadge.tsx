type CountdownBadgeProps = {
  label: string | null
  emphasized?: boolean
}

export default function CountdownBadge({ label, emphasized = false }: CountdownBadgeProps) {
  if (!label) return null

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        emphasized
          ? 'bg-[var(--brand-primary)] text-white'
          : 'border border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-subtle)]'
      }`}
    >
      {label}
    </span>
  )
}
