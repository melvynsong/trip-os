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

export default function SavedStoryCard({ story }: SavedStoryCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = story.title ? `${story.title}\n\n${story.content}` : story.content
    await copyText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-gray-900">{story.title || 'Untitled Story'}</div>
          <div className="text-xs text-gray-500">
            {story.story_type.replace('_', ' ')} · {story.tone.replace('_', ' ')} · {story.length}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-emerald-600">Copied!</span>
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

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{story.content}</p>

      <div className="mt-2 text-xs text-gray-400">{formatDate(story.created_at)}</div>
    </div>
  )
}
