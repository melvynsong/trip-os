import Link from 'next/link'
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
        <ClickableCard key={action.label} href={action.href} className="min-h-[124px] p-4">
          <div className="text-2xl">{action.icon}</div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">{action.label}</h3>
          <p className="mt-1 text-xs text-gray-500">{action.subtitle}</p>
        </ClickableCard>
      ))}
    </div>
  )
}
