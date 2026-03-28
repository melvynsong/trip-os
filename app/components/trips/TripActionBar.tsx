import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type TripActionBarProps = {
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
}

export default function TripActionBar({
  backHref,
  backLabel = 'Back',
  actions,
  className,
}: TripActionBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="min-h-9">
        {backHref ? (
          <Link
            href={backHref}
            className={buttonClass({
              size: 'sm',
              variant: 'ghost',
              className: 'rounded-full text-[var(--text-strong)] hover:bg-[var(--surface-muted)]',
            })}
          >
            ← {backLabel}
          </Link>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center justify-end gap-3">{actions}</div> : <div />}
    </div>
  )
}
