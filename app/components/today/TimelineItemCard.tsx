'use client'

import { getEmoji } from '@/lib/utils/getEmoji'
import { Activity as ActivityType } from '@/types/trip'

export type TodayItem = Pick<
  ActivityType,
  'id' | 'day_id' | 'title' | 'activity_time' | 'type' | 'notes' | 'status' | 'sort_order'
>

type TimelineItemCardProps = {
  tripId: string
  item: TodayItem
  canMoveUp: boolean
  canMoveDown: boolean
  isActing: boolean
  onToggleDone: (item: TodayItem) => void
  onDelete: (item: TodayItem) => void
  onMoveUp: (item: TodayItem) => void
  onMoveDown: (item: TodayItem) => void
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

export default function TimelineItemCard({
  item,
  canMoveUp,
  canMoveDown,
  isActing,
  onToggleDone,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TimelineItemCardProps) {
  const isDone = item.status === 'done'

  return (
    <div
      className={`flex gap-3 rounded-xl border p-4 transition-all ${
        isDone
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white shadow-sm'
      }`}
    >
      {/* Done toggle */}
      <button
        onClick={() => onToggleDone(item)}
        disabled={isActing}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          isDone
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        } disabled:cursor-not-allowed`}
        title={isDone ? 'Mark incomplete' : 'Mark done'}
      >
        {isDone && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className={`font-medium leading-snug ${isDone ? 'line-through text-gray-400' : ''}`}>
            {getEmoji(item.type)} {item.title}
          </div>
          {item.activity_time && (
            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs tabular-nums text-gray-600">
              {formatTime(item.activity_time)}
            </span>
          )}
        </div>

        <div className="mt-0.5 text-xs capitalize text-gray-400">{item.type}</div>

        {item.notes && !isDone && (
          <div className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.notes}</div>
        )}

        {/* Action row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onMoveUp(item)}
            disabled={!canMoveUp || isActing}
            className="rounded-lg border px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(item)}
            disabled={!canMoveDown || isActing}
            className="rounded-lg border px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <button
            onClick={() => onDelete(item)}
            disabled={isActing}
            className="ml-auto rounded-lg px-2 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
