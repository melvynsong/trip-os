export type Trip = {
  id: string
  user_id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  cover_image: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Day = {
  id: string
  trip_id: string
  day_number: number
  date: string
  title: string | null
  created_at: string
}

export type PlaceType =
  | 'attraction'
  | 'restaurant'
  | 'shopping'
  | 'cafe'
  | 'hotel'
  | 'other'

export type PlaceCategory =
  | 'food'
  | 'attraction'
  | 'shopping'
  | 'hotel'
  | 'other'

export type PlaceSource = 'openstreetmap' | 'manual'

export type Place = {
  id: string
  trip_id: string
  name: string
  category: PlaceCategory
  place_type: PlaceType | null
  address: string | null
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  external_place_id: string | null
  source: PlaceSource | null
  notes: string | null
  visited: boolean | null
  created_at: string
  updated_at: string | null
}

export type ActivityType =
  | 'food'
  | 'attraction'
  | 'shopping'
  | 'transport'
  | 'note'
  | 'hotel'
  | 'other'

export type ActivityStatus = 'planned' | 'booked' | 'done'

export type Activity = {
  id: string
  day_id: string
  place_id: string | null
  title: string
  activity_time: string | null
  type: ActivityType
  notes: string | null
  status: ActivityStatus
  sort_order: number
  created_at: string
}

export type JournalEntry = {
  id: string
  trip_id: string
  day_id: string | null
  content: string
  photos: string[]
  created_at: string
}