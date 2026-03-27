import Link from 'next/link'
import Card from '@/app/components/ui/Card'
import { buttonClass } from '@/app/components/ui/Button'

type ActivityPreview = {
  title: string
  time: string | null
  type: string
}

type TodayCardProps = {
  dayLabel: string
  nowActivity: ActivityPreview | null
  nextActivity: ActivityPreview | null
  todayHref: string
}

function activityLabel(activity: ActivityPreview | null, emptyText: string) {
  if (!activity) return emptyText
  return `${activity.time ? `${activity.time} · ` : ''}${activity.title}`
}

export default function TodayCard({
  dayLabel,
  nowActivity,
  nextActivity,
  todayHref,
}: TodayCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Today</p>
          <h3 className="mt-1 text-xl font-semibold text-[var(--text-strong)]">{dayLabel}</h3>
        </div>
        <span className="rounded-full border border-[var(--border-soft)] bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--text-strong)]">Live Plan</span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Now</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{activityLabel(nowActivity, 'Nothing active right now.')}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">Next</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-strong)]">{activityLabel(nextActivity, 'No next activity yet.')}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={todayHref} className={buttonClass({ variant: 'primary' })}>
          View Today
        </Link>
        <Link href={todayHref} className={buttonClass({ variant: 'secondary' })}>
          Replan Today
        </Link>
      </div>
    </Card>
  )
}
