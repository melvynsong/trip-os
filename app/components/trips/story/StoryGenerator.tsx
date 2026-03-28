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
        credentials: 'include',
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
      className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[0_2px_16px_rgba(28,25,23,0.06)] sm:p-7"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">AI Story</p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--text-strong)]">Turn this into a story</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-subtle)] sm:text-base">
              Generate a warm, shareable narrative from your trip title, dates, days, moments, and notes.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)]/60 p-4">
            <SegmentedControl
              label="Tone"
              value={tone}
              onChange={(value) => setTone(value as StoryTone)}
              options={STORY_TONE_OPTIONS}
              layout="wrap"
            />
            <SegmentedControl
              label="Length"
              value={length}
              onChange={(value) => setLength(value as StoryLength)}
              options={STORY_LENGTH_OPTIONS}
              layout="wrap"
            />
            <Button
              variant="primary"
              loading={loading}
              onClick={generateStory}
              className="w-full rounded-full"
            >
              {draft ? 'Regenerate' : 'Generate story'}
            </Button>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleCopy} className="rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]">
                  Copy
                </Button>
                <Button variant="secondary" onClick={handleShare} className="rounded-full border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-strong)]">
                  Share
                </Button>
                <Button variant="ghost" onClick={generateStory} loading={loading} className="rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface-muted)]">
                  Regenerate
                </Button>
              </div>
              <StoryPreviewCard title={draft.title} content={previewContent} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)]/60 px-5 py-12 text-center text-sm leading-7 text-[var(--text-subtle)]">
              Generate a narrative to transform your itinerary into an editorial-style travel story.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
