'use client'

import { useCallback, useEffect, useState } from 'react'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import SegmentedControl from '@/app/components/ui/SegmentedControl'
import { LoadingSkeleton } from '@/app/components/ui/LoadingSkeleton'
import type { PackingList, PackingListItem, PackingListCategory } from '@/types/packing-list'
import type { PackingWeatherContext } from '@/lib/ai/packing'
import { buildPackingWhatsAppShareUrl } from '@/lib/share/packing'

type PackingGeneratorProps = {
  tripId: string
  /** Optional weather context forwarded from the server to improve packing accuracy */
  weatherContext: PackingWeatherContext | null
  destination: string
  tripTitle: string
}

const STYLE_OPTIONS: { value: PackingStyle; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
]

const STYLE_DESCRIPTION: Record<PackingStyle, string> = {
  light: 'Carry-on only. Minimal, re-usable.',
  moderate: 'Balanced. One bag, comfortable options.',
  heavy: 'Full luggage. Comfort and options.',
}

const SECTION_LABELS: Record<keyof PackingList['sections'], string> = {
  clothing: 'Clothing', // Refactored to categories
  outerwear: 'Outerwear', // Refactored to categories
  footwear: 'Footwear', // Refactored to categories
  weather_specific: 'Weather-specific', // Refactored to categories
  essentials: 'Essentials', // Refactored to categories
  optional: 'Optional', // Refactored to categories
}

const CATEGORY_ORDER = [
  'Clothing',
  'Outerwear',
  'Footwear',
  'Weather-specific',
  'Essentials',
  'Optional',
] as const

function storageKey(tripId: string) {
  return `tgs_packing_${tripId}`
}

function loadFromStorage(tripId: string): PackingList | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(tripId))
    if (!raw) return null
    return JSON.parse(raw) as PackingList
  } catch {
    return null
  }
}

function saveToStorage(tripId: string, list: PackingList) {
  try {
    localStorage.setItem(storageKey(tripId), JSON.stringify(list))
  } catch {
    // Ignore storage errors silently
  }
}

function clearFromStorage(tripId: string) {
  try {
    localStorage.removeItem(storageKey(tripId))
  } catch {
    // Ignore
  }
}

function WeatherBadge({ context }: { context: PackingWeatherContext }) {
  if (context.mode === 'none') return null

  const labels = {
    forecast: 'Based on daily forecast',
    outlook: 'Based on early outlook',
    climate: 'Based on typical climate',
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
      <span className="text-xs text-[var(--text-subtle)]">
        {labels[context.mode]}: <span className="font-medium text-[var(--text-strong)]">{context.headline}</span>
        {context.note ? ` — ${context.note}` : ''}
      </span>
    </div>
  )
}

function ItemRow({ item }: { item: PackingItem }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border-soft)] last:border-0">
      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--brand-primary)]/40" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-[var(--text-strong)]">{item.item}</span>
          <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--text-subtle)]">
            {item.quantity}
          </span>
        </div>
        {item.note ? (
          <p className="mt-0.5 text-xs leading-5 text-[var(--text-subtle)]">{item.note}</p>
        ) : null}
      </div>
    </div>
  )
}

function SectionCard({ sectionKey, items }: { sectionKey: keyof PackingList['sections']; items: PackingItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-white">
      <div className="border-b border-[var(--border-soft)] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
          {SECTION_LABELS[sectionKey]}
        </p>
      </div>
      <div className="px-4">
        {items.map((item, i) => (
          <ItemRow key={`${item.item}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}

function PackingListSkeleton() {
  return (
    <div className="space-y-3">
      {[92, 64, 76, 85, 68].map((w, i) => (
        <LoadingSkeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  )
}

export default function PackingGenerator({
  tripId,
  weatherContext,
  destination,
  tripTitle,
}: PackingGeneratorProps) {
  const [style, setStyle] = useState<PackingStyle>('moderate')
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMounted, setHasMounted] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setHasMounted(true)
    const saved = loadFromStorage(tripId)
    if (saved) {
      setPackingList(saved)
      setStyle(saved.packing_style)
    }
  }, [tripId])

  const handleGenerate = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    // Clear existing state immediately so regeneration feels clean
    setPackingList(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/packing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          packingStyle: style,
          weather: weatherContext
            ? {
                mode: weatherContext.mode,
                headline: weatherContext.headline,
                note: weatherContext.note,
                avgMinTempC: weatherContext.avgMinTempC,
                avgMaxTempC: weatherContext.avgMaxTempC,
                rainyDaysPercent: weatherContext.rainyDaysPercent,
              }
            : null,
        }),
      })

      const payload = (await response.json()) as { packingList?: PackingList; error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate packing list.')
      }

      if (!payload.packingList) {
        throw new Error('No packing list was returned. Please try again.')
      }

      setPackingList(payload.packingList)
      saveToStorage(tripId, payload.packingList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate packing list.')
    } finally {
      setIsGenerating(false)
    }
  }, [tripId, style, weatherContext])

  const handleClear = useCallback(() => {
    setPackingList(null)
    clearFromStorage(tripId)
  }, [tripId])

  const handleShareWhatsApp = useCallback(() => {
    if (!packingList) return

    const url = buildPackingWhatsAppShareUrl({
      tripTitle,
      destination,
      style,
      list: packingList,
    })

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [destination, packingList, style, tripTitle])

  const hasResult = packingList !== null

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="space-y-5 rounded-[2rem] border-[var(--border-soft)] bg-white p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            Packing <span className="rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-accent)]">Beta</span>
          </p>
          <h2 className="text-xl font-serif text-[var(--text-strong)]">{destination}</h2>
        </div>

        {weatherContext && weatherContext.mode !== 'none' ? (
          <WeatherBadge context={weatherContext} />
        ) : null}

        <div className="space-y-1.5">
          <SegmentedControl
            label="Packing style"
            value={style}
            options={STYLE_OPTIONS}
            onChange={setStyle}
            columns={3}
          />
          <p className="text-xs text-[var(--text-subtle)]">{STYLE_DESCRIPTION[style]}</p>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={isGenerating}
          onClick={handleGenerate}
          className="w-full rounded-full"
        >
          {isGenerating
            ? 'Building your list…'
            : hasResult
              ? 'Regenerate list'
              : 'Generate packing list'}
        </Button>

        {error ? (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {error}
          </div>
        ) : null}
      </Card>

      {/* Result */}
      {isGenerating ? (
        <PackingListSkeleton />
      ) : hasMounted && hasResult ? (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className="rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary-soft)] px-4 py-3.5">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{packingList.summary}</p>
          </div>

          {/* Sections */}
          {SECTION_ORDER.map((key) => (
            <SectionCard key={key} sectionKey={key} items={packingList.sections[key]} />
          ))}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-[var(--text-subtle)]">
              {packingList.packing_style} packing · weather: {packingList.weather_basis}
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleShareWhatsApp}
                className="rounded-full"
              >
                Share via WhatsApp
              </Button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-[var(--text-subtle)] underline hover:text-[var(--text-strong)]"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
