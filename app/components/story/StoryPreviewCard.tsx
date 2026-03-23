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
    <div className="relative overflow-hidden rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,252,247,1),rgba(248,242,233,0.92))] p-5 shadow-[0_18px_50px_rgba(41,31,24,0.05)] sm:p-6">
      <div className="absolute left-0 top-0 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl" />
      <button
        onClick={handleCopy}
        className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm backdrop-blur transition-all hover:bg-white active:scale-95"
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

      <div className="relative space-y-4 pr-20">
        <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-900/80">
          Story draft
        </div>
        {title ? <h3 className="font-serif text-3xl leading-tight text-stone-900">{title}</h3> : null}
      </div>

      <div className="relative mt-5 rounded-[1.5rem] border border-white/70 bg-white/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5">
        <p className="whitespace-pre-wrap text-sm leading-8 text-stone-700 sm:text-[15px]">{content}</p>
      </div>
    </div>
  )
}
