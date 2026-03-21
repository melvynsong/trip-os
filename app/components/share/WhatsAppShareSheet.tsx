'use client'

import { useMemo, useState } from 'react'
import { buildWhatsAppShareUrl, type ShareLength } from '@/lib/share/whatsapp'

type WhatsAppShareSheetProps = {
  title: string
  shortText: string
  detailedText: string
  triggerLabel?: string
  triggerClassName?: string
}

async function copyToClipboard(text: string) {
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

export default function WhatsAppShareSheet({
  title,
  shortText,
  detailedText,
  triggerLabel = 'Share',
  triggerClassName = 'rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50',
}: WhatsAppShareSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [length, setLength] = useState<ShareLength>('short')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share)

  const text = useMemo(() => {
    return length === 'short' ? shortText : detailedText
  }, [length, shortText, detailedText])

  async function handleCopy() {
    try {
      await copyToClipboard(text)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  function handleShareWhatsApp() {
    const url = buildWhatsAppShareUrl(text)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleNativeShare() {
    if (!canNativeShare) return

    try {
      await navigator.share({ text, title })
    } catch {
      // User cancelled or share target failed; keep silent.
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={triggerClassName}>
        📤 {triggerLabel}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t bg-white shadow-2xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[85vh] md:w-[min(680px,92vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-gray-500">Preview before sharing to WhatsApp</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="inline-flex rounded-xl border p-1">
                <button
                  onClick={() => setLength('short')}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    length === 'short' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Short
                </button>
                <button
                  onClick={() => setLength('detailed')}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    length === 'detailed' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <pre className="whitespace-pre-wrap rounded-xl border bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                {text}
              </pre>
            </div>

            <div className="border-t px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={handleCopy}
                  className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copyState === 'copied'
                    ? '✅ Copied'
                    : copyState === 'error'
                      ? '⚠️ Copy failed'
                      : 'Copy text'}
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Share to WhatsApp
                </button>

                {canNativeShare ? (
                  <button
                    onClick={handleNativeShare}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Share…
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
