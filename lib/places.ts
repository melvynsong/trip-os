export type PlaceType =
  | 'attraction'
  | 'restaurant'
  | 'shopping'
  | 'cafe'
  | 'hotel'
  | 'other'

export type PlaceSource = 'google_places' | 'manual'

export const PLACE_TYPE_OPTIONS: Array<{ value: PlaceType; label: string; emoji: string }> = [
  { value: 'attraction', label: 'Attraction', emoji: '📍' },
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'cafe', label: 'Cafe', emoji: '☕' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'other', label: 'Other', emoji: '📌' },
]

export function getPlaceTypeLabel(type: PlaceType) {
  const match = PLACE_TYPE_OPTIONS.find((option) => option.value === type)
  return match?.label ?? 'Other'
}

export function getPlaceTypeEmoji(type: PlaceType | string | null | undefined) {
  switch (type) {
    case 'attraction':
      return '📍'
    case 'restaurant':
      return '🍽️'
    case 'shopping':
      return '🛍️'
    case 'cafe':
      return '☕'
    case 'hotel':
      return '🏨'
    case 'food':
      return '🍽️'
    default:
      return '📌'
  }
}

export function toLegacyCategory(type: PlaceType): 'food' | 'attraction' | 'shopping' | 'hotel' | 'other' {
  switch (type) {
    case 'restaurant':
    case 'cafe':
      return 'food'
    case 'attraction':
      return 'attraction'
    case 'shopping':
      return 'shopping'
    case 'hotel':
      return 'hotel'
    case 'other':
    default:
      return 'other'
  }
}

export function resolvePlaceType(input: {
  place_type?: string | null
  category?: string | null
}): PlaceType {
  const placeType = (input.place_type ?? '').toLowerCase().trim()
  if (
    placeType === 'attraction' ||
    placeType === 'restaurant' ||
    placeType === 'shopping' ||
    placeType === 'cafe' ||
    placeType === 'hotel' ||
    placeType === 'other'
  ) {
    return placeType
  }

  const category = (input.category ?? '').toLowerCase().trim()
  if (category === 'food') return 'restaurant'
  if (category === 'attraction') return 'attraction'
  if (category === 'shopping') return 'shopping'
  if (category === 'hotel') return 'hotel'
  return 'other'
}

export function mapPlaceTypeToGoogleType(placeType: PlaceType): string {
  switch (placeType) {
    case 'attraction':
      return 'tourist_attraction'
    case 'restaurant':
      return 'restaurant'
    case 'shopping':
      return 'shopping_mall'
    case 'cafe':
      return 'cafe'
    case 'hotel':
      return 'lodging'
    case 'other':
    default:
      return 'establishment'
  }
}
