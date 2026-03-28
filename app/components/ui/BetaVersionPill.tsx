import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

type BetaVersionPillProps = {
  version: string
  ownerHistoryHref?: string
  className?: string
}

export default function BetaVersionPill({
  version,
  ownerHistoryHref,
  className,
}: BetaVersionPillProps) {
  return (
    <div
      className={cn(
        'group relative inline-flex h-7 w-[12.5rem] items-center justify-end overflow-hidden rounded-full border border-[var(--border-soft)] bg-white px-2.5 text-xs text-[var(--text-subtle)]',
        className
      )}
      aria-label={`Version ${version}`}
    >
      <span className="inline-flex items-center rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)] transition-opacity duration-200 group-hover:opacity-0">
        Beta
      </span>

      <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 translate-x-2 items-center gap-2 whitespace-nowrap opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100">
        <span className="text-[11px] font-medium text-[var(--text-strong)]">Version {version}</span>
        {ownerHistoryHref ? (
          <Link
            href={ownerHistoryHref}
            className="text-[11px] font-medium text-[var(--brand-primary)] hover:underline"
          >
            Release history
          </Link>
        ) : null}
      </span>
    </div>
  )
}
