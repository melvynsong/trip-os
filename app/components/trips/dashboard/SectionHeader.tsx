import Link from 'next/link'
import { buttonClass } from '@/app/components/ui/Button'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-strong)]">{title}</h2>
        {subtitle ? <p className="text-sm text-[var(--text-subtle)]">{subtitle}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={buttonClass({ size: 'sm', variant: 'ghost', className: 'rounded-full' })}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
