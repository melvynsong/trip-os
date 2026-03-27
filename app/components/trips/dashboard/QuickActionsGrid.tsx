import ClickableCard from '@/app/components/ui/ClickableCard'

type QuickAction = {
  label: string
  subtitle: string
  icon: string
  href: string
}

type QuickActionsGridProps = {
  actions: QuickAction[]
}

export default function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <ClickableCard key={action.label} href={action.href} className="min-h-[124px] border-[var(--border-soft)] bg-[var(--surface-panel)] p-4">
          <div className="text-2xl">{action.icon}</div>
          <h3 className="mt-2 text-sm font-semibold text-[var(--text-strong)]">{action.label}</h3>
          <p className="mt-1 text-xs text-[var(--text-subtle)]">{action.subtitle}</p>
        </ClickableCard>
      ))}
    </div>
  )
}
