import { cn } from '@/lib/utils/cn'
import TripActionBar from '@/app/components/trips/TripActionBar'

type TripHeaderProps = {
  dateRange?: string
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  metadata?: React.ReactNode
  className?: string
}

export default function TripHeader({
  dateRange,
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  metadata,
  className,
}: TripHeaderProps) {
  return (
    <header className={cn('space-y-5', className)}>
      <div className="space-y-2">
        {dateRange ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)] sm:text-sm">
            {dateRange}
          </p>
        ) : null}
        <h1 className="font-serif text-4xl leading-tight text-[var(--text-strong)] sm:text-5xl">{title}</h1>
        {subtitle ? <p className="text-base text-[var(--text-subtle)] sm:text-lg">{subtitle}</p> : null}
        {metadata ? <div className="pt-1">{metadata}</div> : null}
      </div>

      {(backHref || actions) ? (
        <TripActionBar backHref={backHref} backLabel={backLabel} actions={actions} />
      ) : null}
    </header>
  )
}
