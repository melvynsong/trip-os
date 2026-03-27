import { cn } from '@/lib/utils/cn'

type EmptyStateProps = {
  title: string
  description: string
  className?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, className, action }: EmptyStateProps) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-8 text-center', className)}>
      <div className="text-sm font-semibold text-[var(--text-strong)]">{title}</div>
      <p className="mt-2 text-sm leading-7 text-[var(--text-subtle)]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
