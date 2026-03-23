'use client'

import { useMemo, useState } from 'react'
import StoryPreviewCard from '@/app/components/story/StoryPreviewCard'
import SegmentedControl from '@/app/components/ui/SegmentedControl'
import Button from '@/app/components/ui/Button'
import { useToast } from '@/app/components/ui/ToastProvider'
import { buildTripStoryText } from '@/lib/trip-storytelling'
import {
  STORY_LENGTH_OPTIONS,
  STORY_TONE_OPTIONS,
  type StoryLength,
  type StoryTone,
} from '@/lib/story/types'

type TripStoryDraft = {
  title: string
  introduction: string
  days: Array<{ heading: string; narrative: string }>
  closingReflection: string
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

export default function StoryGenerator({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const { showToast } = useToast()
  const [tone, setTone] = useState<StoryTone>('travel_journal')
  const [length, setLength] = useState<StoryLength>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<TripStoryDraft | null>(null)

  const compiledText = useMemo(
    () =>
      draft
        ? buildTripStoryText({
            title: draft.title,
            introduction: draft.introduction,
            days: draft.days,
            closingReflection: draft.closingReflection,
          })
        : '',
    [draft]
  )

  async function generateStory() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/trips/${tripId}/trip-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, length }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate trip story.')
      setDraft(json.story)
      showToast('Trip story generated.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Trip story generation failed.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!compiledText) return
    await copyText(compiledText)
    showToast('Trip story copied to clipboard.', 'success')
  }

  async function handleShare() {
    if (!compiledText) return

    if (navigator.share) {
      await navigator.share({ title: draft?.title || tripTitle, text: compiledText })
      return
    }

    await handleCopy()
  }

  const previewContent = draft
    ? [
        draft.introduction,
        '',
        ...draft.days.flatMap((day) => [day.heading, day.narrative, '']),
        draft.closingReflection,
      ]
        .join('\n')
        .trim()
    : ''

  return (
    <section
      id="trip-story-generator"
      className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(41,31,24,0.05)] sm:p-7"
    >
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">AI Story</p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900">Turn this into a story</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
              Generate a warm, shareable narrative from your trip title, dates, days, moments, and notes.
            </p>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-4">
            <SegmentedControl
              label="Tone"
              value={tone}
              onChange={(value) => setTone(value as StoryTone)}
              options={STORY_TONE_OPTIONS}
            />
            <SegmentedControl
              label="Length"
              value={length}
              onChange={(value) => setLength(value as StoryLength)}
              options={STORY_LENGTH_OPTIONS}
            />
            <Button
              variant="primary"
              loading={loading}
              onClick={generateStory}
              className="w-full rounded-full bg-stone-900 text-white hover:bg-stone-800"
            >
              {draft ? 'Regenerate' : 'Generate story'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleCopy} className="rounded-full border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100">
                  Copy
                </Button>
                <Button variant="secondary" onClick={handleShare} className="rounded-full border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100">
                  Share
                </Button>
                <Button variant="ghost" onClick={generateStory} loading={loading} className="rounded-full text-stone-700 hover:bg-stone-100">
                  Regenerate
                </Button>
              </div>
              <StoryPreviewCard title={draft.title} content={previewContent} />
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50/60 px-5 py-12 text-center text-sm leading-7 text-stone-500">
              Generate a narrative to transform your itinerary into an editorial-style travel story.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
