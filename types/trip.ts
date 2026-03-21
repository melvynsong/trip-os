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

export type StoryScope = 'day' | 'place'

export type StoryTone =
  | 'warm_personal'
  | 'fun_casual'
  | 'reflective'
  | 'travel_journal'
  | 'family_memory'
  | 'food_focused'

export type StoryLength = 'short' | 'medium' | 'long'

export type StoryType =
  | 'day_summary'
  | 'place_story'
  | 'restaurant_story'
  | 'activity_story'
  | 'caption'
  | 'food_note'

export type Story = {
  id: string
  trip_id: string
  story_scope: StoryScope
  story_type: StoryType
  related_date: string | null
  related_place_id: string | null
  related_activity_id: string | null
  tone: StoryTone
  length: StoryLength
  focus: string | null
  title: string | null
  content: string
  created_at: string
  updated_at: string
}