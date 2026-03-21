'use client'

import { useState } from 'react'

type StoryPreviewCardProps = {
  title: string | null
  content: string
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

export default function StoryPreviewCard({ title, content }: StoryPreviewCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = title ? `${title}\n\n${content}` : content
    await copyText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="relative rounded-xl border bg-gray-50 p-4">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
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

      {title ? <h3 className="mb-2 pr-20 font-semibold text-gray-900">{title}</h3> : null}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 pt-1">{content}</p>
    </div>
  )
}
