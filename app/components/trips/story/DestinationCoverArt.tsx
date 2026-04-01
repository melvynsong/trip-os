function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(value: string) {
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return 'TG'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}



export default function DestinationCoverArt({
  destination,
  title,
  compact = false,
  showLabel = true,
  dark = false,
}: {
  destination: string
  title?: string
  compact?: boolean
  showLabel?: boolean
  dark?: boolean
}) {

  const initials = getInitials(destination || title || 'ToGoStory')

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-stone-100">
      {showLabel ? (
        <div className={`absolute ${compact ? 'bottom-3 left-4 right-4' : 'bottom-6 left-6 right-6'} flex items-end justify-between gap-4`}>
  // Render nothing but the label and initials, no background, no blobs, no watermark
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
              {destination || 'Travel story'}
            </p>
            {title ? (
              <p className={`mt-1 max-w-[14rem] truncate font-serif text-[var(--text-strong)]/75 ${compact ? 'text-base' : 'text-2xl'}`}>
                {title}
              </p>
            ) : null}
          </div>
          <div className={`flex shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/60 font-serif text-[var(--text-strong)] shadow-sm backdrop-blur ${compact ? 'h-12 w-12 text-sm' : 'h-20 w-20 text-2xl'}`}>
            {initials}
          </div>
        </div>
      ) : null}
    </div>
  )
}
