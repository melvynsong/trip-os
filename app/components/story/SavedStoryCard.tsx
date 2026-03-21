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
    await copyText(story.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
          className="rounded-lg border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{story.content}</p>

      <div className="mt-2 text-xs text-gray-400">{formatDate(story.created_at)}</div>
    </div>
  )
}
