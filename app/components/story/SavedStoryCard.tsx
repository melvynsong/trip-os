'use client'

import { useState } from 'react'
import { Story as StoryType } from '@/types/trip'

type SavedStoryCardProps = {
  story: Pick<
    StoryType,
    'id' | 'title' | 'content' | 'story_type' | 'created_at' | 'tone' | 'length'
  >
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

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ')
}

export default function SavedStoryCard({ story }: SavedStoryCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = story.title ? `${story.title}\n\n${story.content}` : story.content
    await copyText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_50px_rgba(41,31,24,0.05)]">
      <div className="border-b border-stone-100 bg-[linear-gradient(135deg,#703CEC,#9093F3)] px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
              <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-1">{formatLabel(story.story_type)}</span>
              <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-1">{formatLabel(story.tone)}</span>
              <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-1">{story.length}</span>
            </div>
            <div>
              <h3 className="font-serif text-2xl leading-tight text-stone-900">
                {story.title || 'Untitled Story'}
              </h3>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                Saved {formatDate(story.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50 active:scale-95"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <p className="whitespace-pre-wrap text-sm leading-8 text-stone-700 sm:text-[15px]">{story.content}</p>
      </div>
    </article>
  )
}
