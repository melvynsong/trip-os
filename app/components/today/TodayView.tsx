'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import TodayHeader from './TodayHeader'
import TodayQuickActions from './TodayQuickActions'
import TodayNowNextCard, { type NowNextActivity } from './TodayNowNextCard'
import DayTimeline from './DayTimeline'
import ReplanPreviewPanel from './ReplanPreviewPanel'
import AddManualItemForm from './AddManualItemForm'
import WhatsAppShareSheet from '@/app/components/share/WhatsAppShareSheet'
import StoryGenerationSheet from '@/app/components/story/StoryGenerationSheet'
import StoryListSection from '@/app/components/story/StoryListSection'
import { type TodayItem } from './TimelineItemCard'
import { type AiReplanResult, type QuickActionType } from '@/lib/ai/today'
import { formatTodayForWhatsApp } from '@/lib/share/whatsapp'
import { type ActivityType } from '@/types/trip'

// ---------------------------------------------------------------------------
// Types passed in from the server page
// ---------------------------------------------------------------------------

export type TodayViewProps = {
  tripId: string
  dayId: string
  tripTitle: string
  destination: string
  date: string
  dayTitle: string | null
  dayNumber: number
  hotel: string | null
  tripStatus: 'upcoming' | 'active' | 'past'
  initialItems: TodayItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNowNext(items: TodayItem[]): {
  now: NowNextActivity | null
  next: NowNextActivity | null
} {
  const d = new Date()
  const currentMinutes = d.getHours() * 60 + d.getMinutes()

  const timed = items
    .filter((i) => i.activity_time && i.status !== 'done')
    .sort((a, b) => (a.activity_time! < b.activity_time! ? -1 : 1))

  let now: NowNextActivity | null = null
  let next: NowNextActivity | null = null

  for (const item of timed) {
    const [h, m] = item.activity_time!.split(':').map(Number)
    const itemMinutes = h * 60 + m

    if (itemMinutes <= currentMinutes) {
      now = item
    } else if (!next) {
      next = item
      break
    }
  }

  return { now, next }
}

function sortItems(items: TodayItem[]): TodayItem[] {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    if (a.activity_time && b.activity_time)
      return a.activity_time < b.activity_time ? -1 : 1
    if (a.activity_time) return -1
    if (b.activity_time) return 1
    return 0
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TodayView({
  tripId,
  dayId,
  tripTitle,
  destination,
  date,
  dayTitle,
  dayNumber,
  hotel,
  tripStatus,
  initialItems,
}: TodayViewProps) {
  const [items, setItems] = useState<TodayItem[]>(sortItems(initialItems))
  const [actingIds, setActingIds] = useState<Set<string>>(new Set())
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isRequestingAdd, setIsRequestingAdd] = useState(false)
  const [isReplanning, setIsReplanning] = useState(false)
  const [replanDraft, setReplanDraft] = useState<AiReplanResult | null>(null)
  const [isApplyingReplan, setIsApplyingReplan] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [storyRefreshKey, setStoryRefreshKey] = useState(0)

  const { now, next } = useMemo(() => getNowNext(items), [items])

  const shortShareText = useMemo(
    () =>
      formatTodayForWhatsApp(
        {
          tripTitle,
          date,
          city: destination,
          hotel,
          activities: items.map((item) => ({
            title: item.title,
            type: item.type,
            activity_time: item.activity_time,
            notes: item.notes,
          })),
        },
        { length: 'short' }
      ),
    [tripTitle, date, destination, hotel, items]
  )

  const detailedShareText = useMemo(
    () =>
      formatTodayForWhatsApp(
        {
          tripTitle,
          date,
          city: destination,
          hotel,
          activities: items.map((item) => ({
            title: item.title,
            type: item.type,
            activity_time: item.activity_time,
            notes: item.notes,
          })),
        },
        { length: 'detailed' }
      ),
    [tripTitle, date, destination, hotel, items]
  )

  // --- helpers ---

  function addActing(id: string) {
    setActingIds((prev) => new Set([...prev, id]))
  }
  function removeActing(id: string) {
    setActingIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
  }

  const base = `/api/trips/${tripId}/today/${dayId}`

  // ---------------------------------------------------------------------------
  // Mark done (optimistic)
  // ---------------------------------------------------------------------------
  const handleToggleDone = useCallback(
    async (item: TodayItem) => {
      const newStatus = item.status === 'done' ? 'planned' : 'done'
      const prev = items

      // Optimistic update
      setItems((cur) =>
        cur.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      )
      addActing(item.id)

      try {
        const res = await fetch(`${base}/activities/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? 'Failed to update status.')
        }
      } catch (err) {
        // Rollback
        setItems(prev)
        setGlobalError(err instanceof Error ? err.message : 'Error.')
      } finally {
        removeActing(item.id)
      }
    },
    [items, base]
  )

  // ---------------------------------------------------------------------------
  // Delete (optimistic)
  // ---------------------------------------------------------------------------
  const handleDelete = useCallback(
    async (item: TodayItem) => {
      if (!confirm(`Remove "${item.title}" from today?`)) return

      const prev = items
      setItems((cur) => cur.filter((i) => i.id !== item.id))
      addActing(item.id)

      try {
        const res = await fetch(`${base}/activities/${item.id}`, { method: 'DELETE' })
        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? 'Failed to delete.')
        }
      } catch (err) {
        setItems(prev)
        setGlobalError(err instanceof Error ? err.message : 'Error.')
      } finally {
        removeActing(item.id)
      }
    },
    [items, base]
  )

  // ---------------------------------------------------------------------------
  // Reorder up/down (optimistic)
  // ---------------------------------------------------------------------------
  const handleReorder = useCallback(
    async (item: TodayItem, direction: 'up' | 'down') => {
      const sorted = sortItems(items)
      const idx = sorted.findIndex((i) => i.id === item.id)
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1

      if (targetIdx < 0 || targetIdx >= sorted.length) return

      const prev = items

      // Swap sort_order values
      const swapped = [...sorted]
      ;[swapped[idx], swapped[targetIdx]] = [
        { ...swapped[idx], sort_order: swapped[targetIdx].sort_order },
        { ...swapped[targetIdx], sort_order: swapped[idx].sort_order },
      ]

      setItems(sortItems(swapped))
      addActing(item.id)

      try {
        const patchA = fetch(`${base}/activities/${swapped[targetIdx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: swapped[targetIdx].sort_order }),
        })
        const patchB = fetch(`${base}/activities/${swapped[idx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: swapped[idx].sort_order }),
        })
        const [resA, resB] = await Promise.all([patchA, patchB])
        if (!resA.ok || !resB.ok) throw new Error('Failed to save new order.')
      } catch (err) {
        setItems(prev)
        setGlobalError(err instanceof Error ? err.message : 'Reorder failed.')
      } finally {
        removeActing(item.id)
      }
    },
    [items, base]
  )

  const handleMoveUp = useCallback(
    (item: TodayItem) => handleReorder(item, 'up'),
    [handleReorder]
  )
  const handleMoveDown = useCallback(
    (item: TodayItem) => handleReorder(item, 'down'),
    [handleReorder]
  )

  // ---------------------------------------------------------------------------
  // Add item
  // ---------------------------------------------------------------------------
  const handleAddItem = useCallback(
    async (data: {
      title: string
      activity_time: string | null
      type: ActivityType
      notes: string | null
    }) => {
      setIsRequestingAdd(true)
      try {
        const res = await fetch(`${base}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to add item.')

        const newItem = json.activity as TodayItem
        setItems((cur) => sortItems([...cur, newItem]))
        setIsAddingItem(false)
      } catch (err) {
        throw err // Let AddManualItemForm show the error
      } finally {
        setIsRequestingAdd(false)
      }
    },
    [base]
  )

  // ---------------------------------------------------------------------------
  // AI Replan — generate
  // ---------------------------------------------------------------------------
  const handleQuickAction = useCallback(
    async (action: QuickActionType) => {
      setGlobalError(null)
      setIsReplanning(true)

      try {
        const res = await fetch(`${base}/replan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'generate', action }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'AI replan failed.')
        setReplanDraft(json.draft as AiReplanResult)
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : 'AI replan failed.')
      } finally {
        setIsReplanning(false)
      }
    },
    [base]
  )

  // ---------------------------------------------------------------------------
  // AI Replan — apply
  // ---------------------------------------------------------------------------
  const handleAcceptReplan = useCallback(async () => {
    if (!replanDraft) return

    setIsApplyingReplan(true)

    try {
      const res = await fetch(`${base}/replan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'apply', draft: replanDraft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to apply replan.')

      setItems(sortItems(json.activities as TodayItem[]))
      setReplanDraft(null)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to apply replan.')
    } finally {
      setIsApplyingReplan(false)
    }
  }, [replanDraft, base])

  const handleDiscardReplan = useCallback(() => {
    setReplanDraft(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      {/* Back + title row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/trips/${tripId}`}
            className="rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-gray-400">Today</span>
        </div>

        <WhatsAppShareSheet
          title="Share today plan"
          shortText={shortShareText}
          detailedText={detailedShareText}
          triggerLabel="Share"
        />
      </div>

      <div>
        <StoryGenerationSheet
          tripId={tripId}
          scope="day"
          dayId={dayId}
          relatedDate={date}
          title="Generate Day Story"
          triggerLabel="Generate Day Story"
          triggerClassName="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          onSaved={() => setStoryRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Header */}
      <TodayHeader
        tripTitle={tripTitle}
        destination={destination}
        date={date}
        dayTitle={dayTitle}
        dayNumber={dayNumber}
        hotel={hotel}
        tripStatus={tripStatus}
      />

      {/* Global error */}
      {globalError && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="ml-3 shrink-0 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick actions */}
      <TodayQuickActions onAction={handleQuickAction} disabled={isReplanning} />

      {/* AI loading indicator */}
      {isReplanning && (
        <div className="rounded-xl border bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ✨ AI is replanning your day…
        </div>
      )}

      {/* Now / Next */}
      <TodayNowNextCard now={now} next={next} />

      {/* Timeline */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Today's Plan
        </h2>
        <DayTimeline
          tripId={tripId}
          items={items}
          actingIds={actingIds}
          onToggleDone={handleToggleDone}
          onDelete={handleDelete}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      </div>

      {/* Add item section */}
      {isAddingItem ? (
        <AddManualItemForm
          onAdd={handleAddItem}
          isAdding={isRequestingAdd}
          onCancel={() => setIsAddingItem(false)}
        />
      ) : (
        <button
          onClick={() => setIsAddingItem(true)}
          className="w-full rounded-2xl border border-dashed py-4 text-sm font-medium text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700"
        >
          + Add item to today
        </button>
      )}

      {/* Replan preview panel */}
      {replanDraft && (
        <ReplanPreviewPanel
          draft={replanDraft}
          existingItems={items}
          isApplying={isApplyingReplan}
          onAccept={handleAcceptReplan}
          onDiscard={handleDiscardReplan}
        />
      )}

      <StoryListSection
        tripId={tripId}
        scope="day"
        dayId={dayId}
        title="Saved Day Stories"
        refreshKey={storyRefreshKey}
      />
    </div>
  )
}
