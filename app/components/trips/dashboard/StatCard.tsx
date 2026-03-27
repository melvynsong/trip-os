import Card from '@/app/components/ui/Card'

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--text-subtle)]">{hint}</p> : null}
    </Card>
  )
}
