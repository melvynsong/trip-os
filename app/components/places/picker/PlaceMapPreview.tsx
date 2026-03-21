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
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border">
        <iframe
          title={`Map preview for ${label}`}
          className="h-56 w-full"
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
        />
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
