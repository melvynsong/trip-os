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
        'block rounded-2xl border border-[var(--border-soft)] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-[0_14px_30px_rgba(20,33,61,0.12)] active:scale-[0.995] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)]',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
