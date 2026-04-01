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

  // Remove all extra spacing so label sits flush with the top, and reduce gap below
  return (
    <div aria-hidden>
      {showLabel ? (
        <div className={`flex items-start gap-2 px-4 pt-1 pb-1`}> 
          <div className="min-w-0">
            <p className={`font-medium uppercase tracking-[0.2em] ${compact ? 'text-[10px]' : 'text-xs'} text-[var(--text-subtle)] m-0 p-0`}>
              {destination || 'Travel story'}
            </p>
            {title ? (
              <p className={`mt-0.5 max-w-[14rem] truncate font-serif ${compact ? 'text-base' : 'text-2xl'} text-[var(--text-strong)] m-0 p-0`}>
                {title}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
