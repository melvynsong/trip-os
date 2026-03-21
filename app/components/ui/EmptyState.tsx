import { cn } from '@/lib/utils/cn'

type EmptyStateProps = {
  title: string
  description: string
  className?: string
}

export default function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-8 text-center', className)}>
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}
