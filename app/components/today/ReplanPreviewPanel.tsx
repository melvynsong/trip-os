'use client'

import { getEmoji } from '@/lib/utils/getEmoji'
import { type AiReplanResult } from '@/lib/ai/today'
import { type TodayItem } from '@/app/components/today/TimelineItemCard'
import { buttonClass } from '@/app/components/ui/Button'

type ReplanPreviewPanelProps = {
  draft: AiReplanResult
  existingItems: TodayItem[]
  isApplying: boolean
  onAccept: () => void
  onDiscard: () => void
}

function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

export default function ReplanPreviewPanel({
  draft,
  existingItems,
  isApplying,
  onAccept,
  onDiscard,
}: ReplanPreviewPanelProps) {
  const existingIds = new Set(existingItems.map((i) => i.id))

  // Diff: which items were kept, which are new, which were removed
  const keptIds = new Set(
    draft.updatedDay.activities.filter((a) => a.id).map((a) => a.id!)
  )
  const removedItems = existingItems.filter(
    (i) => !keptIds.has(i.id) && i.status !== 'done'
  )
  const newItems = draft.updatedDay.activities.filter((a) => !a.id)
  const keptItems = draft.updatedDay.activities.filter(
    (a) => a.id && existingIds.has(a.id)
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onDiscard}
      />

      {/* Panel — bottom sheet on mobile, right drawer on md+ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl md:bottom-auto md:right-0 md:top-0 md:h-full md:w-96 md:rounded-none md:rounded-l-2xl md:border-l md:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">AI Replan Preview</h2>
            <p className="text-sm text-slate-500">{draft.summary}</p>
          </div>
          <button
            onClick={onDiscard}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Rationale */}
          {draft.rationale && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {draft.rationale}
            </div>
          )}

          {/* Removed */}
          {removedItems.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-500">
                Removed ({removedItems.length})
              </p>
              <div className="space-y-1.5">
                {removedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 line-through"
                  >
                    <span>{getEmoji(item.type)}</span>
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New */}
          {newItems.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-600">
                Added ({newItems.length})
              </p>
              <div className="space-y-1.5">
                {newItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="mr-1">{getEmoji(item.type)}</span>
                      <span className="font-medium text-emerald-800">{item.title}</span>
                      {item.notes && (
                        <div className="mt-0.5 text-xs text-emerald-700">{item.notes}</div>
                      )}
                    </div>
                    {item.activity_time && (
                      <span className="shrink-0 text-xs text-emerald-600">
                        {formatTime(item.activity_time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kept */}
          {keptItems.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Kept ({keptItems.length})
              </p>
              <div className="space-y-1.5">
                {keptItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <div>
                      <span className="mr-1">{getEmoji(item.type)}</span>
                      {item.title}
                    </div>
                    {item.activity_time && (
                      <span className="shrink-0 text-xs text-slate-500">
                        {formatTime(item.activity_time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex gap-3">
            <button
              onClick={onDiscard}
              disabled={isApplying}
              className={buttonClass({
                variant: 'secondary',
                className: 'flex-1 rounded-full border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-sky-50/70',
              })}
            >
              Discard
            </button>
            <button
              onClick={onAccept}
              disabled={isApplying}
              className={buttonClass({
                variant: 'primary',
                className: 'flex-1 rounded-full',
              })}
            >
              {isApplying ? 'Applying…' : 'Accept Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
