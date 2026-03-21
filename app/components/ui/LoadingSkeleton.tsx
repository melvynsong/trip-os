import { cn } from '@/lib/utils/cn'

type LoadingSkeletonProps = {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-200/80', className)} />
}

export function StoryListSkeleton() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-24 w-full" />
      <LoadingSkeleton className="h-24 w-full" />
    </div>
  )
}
