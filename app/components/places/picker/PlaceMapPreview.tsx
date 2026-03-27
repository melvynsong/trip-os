'use client'

type PlaceMapPreviewProps = {
  latitude: number
  longitude: number
  label: string
}

export default function PlaceMapPreview({ latitude, longitude, label }: PlaceMapPreviewProps) {
  const bbox = `${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}`
  const marker = `${latitude}%2C${longitude}`

  return (
    <div className="max-w-full space-y-2 overflow-x-hidden">
      <div className="max-w-full overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] shadow-sm">
        <div className="aspect-[4/3] max-h-[360px] w-full sm:aspect-[16/10]">
          <iframe
            title={`Map preview for ${label}`}
            className="block h-full w-full border-0"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
          />
        </div>
      </div>

      <a
        href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
      >
        Open in Maps ↗
      </a>
    </div>
  )
}
