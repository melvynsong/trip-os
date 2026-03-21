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
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={buttonClass({ size: 'sm', variant: 'ghost' })}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
