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
        'block rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[0_2px_12px_rgba(28,25,23,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(28,25,23,0.1)] active:scale-[0.995] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-brand)] focus-visible:ring-offset-1',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
