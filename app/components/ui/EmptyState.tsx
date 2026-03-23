import { cn } from '@/lib/utils/cn'

type EmptyStateProps = {
  title: string
  description: string
  className?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, className, action }: EmptyStateProps) {
  return (
    <div className={cn('rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50/70 p-8 text-center', className)}>
      <div className="text-sm font-semibold text-stone-800">{title}</div>
      <p className="mt-2 text-sm leading-7 text-stone-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
