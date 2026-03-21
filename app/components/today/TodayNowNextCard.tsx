'use client'

import { getEmoji } from '@/lib/utils/getEmoji'
import { Activity as ActivityType } from '@/types/trip'

export type NowNextActivity = Pick<
  ActivityType,
  'id' | 'title' | 'activity_time' | 'type' | 'notes'
>

type TodayNowNextCardProps = {
  now: NowNextActivity | null
  next: NowNextActivity | null
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

export default function TodayNowNextCard({ now, next }: TodayNowNextCardProps) {
  if (!now && !next) return null

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* NOW */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Now
          </div>
          {now ? (
            <div className="mt-1.5">
              <div className="font-semibold">
                {getEmoji(now.type)} {now.title}
              </div>
              {now.activity_time && (
                <div className="mt-0.5 text-sm text-gray-500">{formatTime(now.activity_time)}</div>
              )}
              {now.notes && (
                <div className="mt-1 text-xs text-gray-400 line-clamp-2">{now.notes}</div>
              )}
            </div>
          ) : (
            <div className="mt-1.5 text-sm text-gray-400">Nothing scheduled right now</div>
          )}
        </div>

        {/* NEXT */}
        <div className="border-t pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Next</div>
          {next ? (
            <div className="mt-1.5">
              <div className="font-semibold">
                {getEmoji(next.type)} {next.title}
              </div>
              {next.activity_time && (
                <div className="mt-0.5 text-sm text-gray-500">{formatTime(next.activity_time)}</div>
              )}
            </div>
          ) : (
            <div className="mt-1.5 text-sm text-gray-400">Nothing else scheduled</div>
          )}
        </div>
      </div>
    </div>
  )
}
