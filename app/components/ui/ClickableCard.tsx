import Link, { type LinkProps } from 'next/link'
import { cn } from '@/lib/utils/cn'

type ClickableCardProps = LinkProps & {
  className?: string
  children: React.ReactNode
}

export default function ClickableCard({ href, className, children, ...props }: ClickableCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.995] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
