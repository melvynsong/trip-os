import { cn } from '@/lib/utils/cn'

type EmptyStateProps = {
  title: string
  description: string
  className?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, className, action }: EmptyStateProps) {
  return (
    <div className={cn('rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center', className)}>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
