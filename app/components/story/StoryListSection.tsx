'use client'

import { useEffect, useState } from 'react'
import SavedStoryCard from '@/app/components/story/SavedStoryCard'
import { Story as StoryType } from '@/types/trip'
import { StoryScope } from '@/lib/story/types'
import EmptyState from '@/app/components/ui/EmptyState'
import { StoryListSkeleton } from '@/app/components/ui/LoadingSkeleton'

type StoryListSectionProps = {
  tripId: string
  scope: StoryScope
  title: string
  dayId?: string
  placeId?: string
  activityId?: string
  refreshKey?: number
  limit?: number
}

type StoryListItem = Pick<
  StoryType,
  'id' | 'title' | 'content' | 'story_type' | 'created_at' | 'tone' | 'length'
>

export default function StoryListSection({
  tripId,
  scope,
  title,
  dayId,
  placeId,
  activityId,
  refreshKey = 0,
  limit = 5,
}: StoryListSectionProps) {
  const [items, setItems] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      const query = new URLSearchParams({
        scope,
        limit: String(limit),
      })
      if (dayId) query.set('dayId', dayId)
      if (placeId) query.set('placeId', placeId)
      if (activityId) query.set('activityId', activityId)

      try {
        const res = await fetch(`/api/trips/${tripId}/stories?${query.toString()}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load stories.')
        if (!cancelled) setItems(json.stories || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error loading stories.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [tripId, scope, dayId, placeId, activityId, limit, refreshKey])

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h3>

      {loading ? <StoryListSkeleton /> : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No saved stories yet"
          description="Generate a story and save it to build your memory timeline."
          className="p-4"
        />
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <SavedStoryCard key={item.id} story={item} />
        ))}
      </div>
    </section>
  )
}
