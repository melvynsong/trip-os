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

function paletteFromSeed(seed: number) {
  const palettes = [
    ['from-amber-50 via-stone-50 to-amber-100', 'bg-amber-200/40', 'bg-stone-300/30'],
    ['from-blue-50 via-slate-50 to-stone-100', 'bg-blue-200/35', 'bg-stone-200/25'],
    ['from-stone-100 via-amber-50 to-rose-50', 'bg-stone-300/30', 'bg-rose-200/20'],
    ['from-orange-50 via-stone-50 to-blue-50', 'bg-orange-100/40', 'bg-blue-200/20'],
    ['from-stone-50 via-amber-50 to-emerald-50', 'bg-stone-200/30', 'bg-emerald-100/25'],
  ] as const

  return palettes[seed % palettes.length]
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
  const seed = hashString(`${destination}-${title || ''}`)
  const [gradient, accentOne, accentTwo] = paletteFromSeed(seed)
  const initials = getInitials(destination || title || 'ToGoStory')

  if (dark) {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        {/* Subtle ambient blobs */}
        <div className={`absolute ${compact ? '-left-6 -top-8 h-24 w-24' : '-left-12 top-0 h-40 w-40'} rounded-full bg-indigo-500/10 blur-2xl`} />
        <div className={`absolute ${compact ? 'right-0 top-6 h-20 w-20' : 'right-4 top-10 h-36 w-36'} rounded-full bg-violet-500/10 blur-2xl`} />
        {/* Monogram watermark */}
        <div className={`absolute ${compact ? 'right-3 top-3 text-5xl' : 'right-6 top-4 text-8xl'} font-serif text-white/[0.06] select-none pointer-events-none`}>
          {initials}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(10,10,18,0.55))]" />
        {showLabel ? (
          <div className={`absolute ${compact ? 'bottom-3 left-4 right-4' : 'bottom-6 left-6 right-6'} flex items-end justify-between gap-4`}>
            <div className="min-w-0">
              <p className={`font-medium uppercase tracking-[0.2em] text-white/45 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {destination || 'Travel story'}
              </p>
              {title ? (
                <p className={`mt-1 max-w-[14rem] truncate font-serif text-white/80 ${compact ? 'text-base' : 'text-2xl'}`}>
                  {title}
                </p>
              ) : null}
            </div>
            <div className={`flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 font-serif text-white shadow-sm ${compact ? 'h-12 w-12 text-sm' : 'h-20 w-20 text-2xl'}`}>
              {initials}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className={`absolute ${compact ? '-left-6 -top-8 h-24 w-24' : '-left-12 top-0 h-40 w-40'} rounded-full blur-2xl ${accentOne}`} />
      <div className={`absolute ${compact ? 'right-0 top-6 h-20 w-20' : 'right-4 top-10 h-36 w-36'} rounded-full blur-2xl ${accentTwo}`} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.45))]" />
      {showLabel ? (
        <div className={`absolute ${compact ? 'bottom-3 left-4 right-4' : 'bottom-6 left-6 right-6'} flex items-end justify-between gap-4`}>
          <div className="min-w-0">
            <p className={`font-medium uppercase tracking-[0.2em] text-[var(--text-subtle)]/75 ${compact ? 'text-[10px]' : 'text-xs'}`}>
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
