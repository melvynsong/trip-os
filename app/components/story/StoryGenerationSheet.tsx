'use client'

import { useMemo, useState } from 'react'
import StoryOptionsForm from '@/app/components/story/StoryOptionsForm'
import StoryPreviewCard from '@/app/components/story/StoryPreviewCard'
import {
  type DayStoryFocus,
  type PlaceStoryTypeOption,
  type SavedStoryType,
  type StoryLength,
  type StoryScope,
  type StoryTone,
} from '@/lib/story/types'

type StoryGenerationSheetProps = {
  tripId: string
  scope: StoryScope
  dayId?: string
  placeId?: string
  activityId?: string
  relatedDate?: string | null
  title: string
  triggerLabel: string
  triggerClassName?: string
  onSaved?: () => void
}

type StoryDraft = {
  title: string | null
  content: string
  storyType: SavedStoryType
}

type GeneratedMeta = {
  scope: StoryScope
  relatedDate: string | null
  relatedPlaceId: string | null
  relatedActivityId: string | null
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const area = document.createElement('textarea')
  area.value = text
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.focus()
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
}

export default function StoryGenerationSheet({
  tripId,
  scope,
  dayId,
  placeId,
  activityId,
  relatedDate,
  title,
  triggerLabel,
  triggerClassName = 'rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50',
  onSaved,
}: StoryGenerationSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tone, setTone] = useState<StoryTone>('warm_personal')
  const [length, setLength] = useState<StoryLength>('medium')
  const [dayFocus, setDayFocus] = useState<DayStoryFocus>('overall_day')
  const [placeStoryType, setPlaceStoryType] = useState<PlaceStoryTypeOption>('short_memory')
  const [draft, setDraft] = useState<StoryDraft | null>(null)
  const [meta, setMeta] = useState<GeneratedMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const generatePayload = useMemo(() => {
    if (scope === 'day') {
      return {
        scope,
        tone,
        length,
        dayId,
        focus: dayFocus,
      }
    }

    return {
      scope,
      tone,
      length,
      placeId,
      activityId,
      dayId,
      placeStoryType,
    }
  }, [scope, tone, length, dayId, dayFocus, placeId, activityId, placeStoryType])

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/trips/${tripId}/stories/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatePayload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate story.')

      setDraft(json.draft)
      setMeta(json.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Story generation failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!draft?.content) return
    await copyText(draft.content)
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 1400)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setError(null)

    try {
      const savePayload = {
        story_scope: scope,
        story_type: draft.storyType,
        related_date: meta?.relatedDate ?? relatedDate ?? null,
        related_place_id: meta?.relatedPlaceId ?? placeId ?? null,
        related_activity_id: meta?.relatedActivityId ?? activityId ?? null,
        tone,
        length,
        focus: scope === 'day' ? dayFocus : placeStoryType,
        title: draft.title,
        content: draft.content,
      }

      const res = await fetch(`/api/trips/${tripId}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save story.')

      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)}>
        ✍️ {triggerLabel}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92vh] flex-col rounded-t-2xl border-t bg-white shadow-2xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[88vh] md:w-[min(760px,94vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-gray-500">Generate, edit by regenerating, copy, and save.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 md:grid-cols-[280px_1fr]">
              <div className="space-y-3 rounded-xl border p-3">
                <StoryOptionsForm
                  scope={scope}
                  tone={tone}
                  length={length}
                  dayFocus={dayFocus}
                  placeStoryType={placeStoryType}
                  onToneChange={setTone}
                  onLengthChange={setLength}
                  onDayFocusChange={setDayFocus}
                  onPlaceStoryTypeChange={setPlaceStoryType}
                />

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Generating…' : draft ? 'Regenerate' : 'Generate Story'}
                </button>
              </div>

              <div className="space-y-3">
                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {draft ? (
                  <StoryPreviewCard title={draft.title} content={draft.content} />
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-gray-500">
                    Generate a draft to preview your story.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={handleCopy}
                  disabled={!draft}
                  className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  {copyState === 'copied' ? 'Copied' : 'Copy'}
                </button>

                <button
                  onClick={handleSave}
                  disabled={!draft || saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save to Memories'}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
