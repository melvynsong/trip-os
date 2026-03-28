import { cn } from '@/lib/utils/cn'

type TripPageShellProps = {
  children: React.ReactNode
  className?: string
  as?: 'main' | 'section' | 'div'
}

export default function TripPageShell({
  children,
  className,
  as = 'main',
}: TripPageShellProps) {
  const Component = as

  return (
    <Component className={cn('mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10', className)}>
      {children}
    </Component>
  )
}
