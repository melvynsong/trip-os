import Link from 'next/link'
import EmptyState from '@/app/components/ui/EmptyState'

type PlacePreview = {
  id: string
  name: string
  city: string | null
  visited: boolean
}

type Group = {
  label: string
  emoji: string
  places: PlacePreview[]
}

type SavedPlacesCarouselProps = {
  groups: Group[]
  viewAllHref: string
}

export default function SavedPlacesCarousel({ groups, viewAllHref }: SavedPlacesCarouselProps) {
  const hasAny = groups.some((group) => group.places.length > 0)

  if (!hasAny) {
    return (
      <EmptyState
        title="No saved places yet"
        description="Add your first place to start building this trip dashboard."
      />
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            {group.emoji} {group.label}
          </h3>

          {group.places.length === 0 ? (
            <div className="rounded-xl border border-dashed p-3 text-sm text-gray-500">
              No places yet in this category.
            </div>
          ) : (
            <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
              {group.places.map((place) => (
                <div
                  key={place.id}
                  className="w-[220px] shrink-0 snap-start rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-gray-900">{place.name}</p>
                    {place.visited ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Visited
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{place.city || 'City unknown'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <Link href={viewAllHref} className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
        View all saved places →
      </Link>
    </div>
  )
}
